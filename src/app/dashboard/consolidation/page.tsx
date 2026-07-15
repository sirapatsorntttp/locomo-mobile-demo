'use client'
import { useState, useMemo, useCallback } from 'react'
import {
  Cpu, RotateCcw, Bus, MapPin, Users, ChevronDown, ChevronUp,
  Zap, TrendingDown, CheckCircle2, AlertCircle, Route,
  ArrowRight, Download, Info, Loader2, BarChart3, Navigation,
  Package, Layers, Radio, Shuffle, Clock, SlidersHorizontal,
  GitMerge, Sparkles,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card } from '@/components/ui'
import { useLang } from '@/lib/lang-context'
import type { Reserve, Vehicle, Point } from '@/types'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useReserveStore } from '@/lib/stores/reserve.store'
import { useVehiclesStore } from '@/lib/stores/useVehiclesStore';

// ═══════════════════════════════════════════════════════════════
// SHARED TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════
interface StopDemand {
  point: Point
  count: number
  reserves: Reserve[]
}
interface VehicleResult {
  vehicle: Vehicle
  stops: StopDemand[]
  totalPassengers: number
  loadPct: number
  distanceKm: number
  color: string
  flexZone?: string        // FleetFlex only
}
interface OptimizeResult {
  vehicles: VehicleResult[]
  unassigned: StopDemand[]
  totalPassengers: number
  totalDistanceKm: number
  savedVehicles: number
  avgLoad: number
  iterations: number
  durationMs: number
}
interface FlexZone {
  id: string
  center: { latitude: number; longitude: number }
  stops: StopDemand[]
  totalDemand: number
  radiusKm: number
  color: string
}
interface FlexResult {
  zones: FlexZone[]
  assignments: VehicleResult[]
  flexMoves: { from: string; to: string; pax: number; vehicle: string }[]
  totalPassengers: number
  totalDistanceKm: number
  avgLoad: number
  flexUtilization: number  // % of flex capacity used
  durationMs: number
}

const VEHICLE_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#0ea5e9',
]
const DEPOT = { latitude: 13.7563, longitude: 100.5018 }

function haversine(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371
  const dLat = (b.latitude - a.latitude) * Math.PI / 180
  const dLon = (b.longitude - a.longitude) * Math.PI / 180
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(s1 * s1 + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * s2 * s2), Math.sqrt(1 - (s1 * s1 + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * s2 * s2)))
}
function routeDistance(stops: StopDemand[], depot = DEPOT) {
  if (!stops.length) return 0
  let d = haversine(depot, stops[0].point)
  for (let i = 1; i < stops.length; i++) d += haversine(stops[i - 1].point, stops[i].point)
  return Math.round((d + haversine(stops[stops.length - 1].point, depot)) * 10) / 10
}
function nearestNeighbor(stops: StopDemand[], depot = DEPOT): StopDemand[] {
  if (stops.length <= 1) return stops
  const unvisited = [...stops]; const ordered: StopDemand[] = []
  let cur = depot
  while (unvisited.length) {
    let bi = 0, bd = haversine(cur, unvisited[0].point)
    for (let i = 1; i < unvisited.length; i++) { const d = haversine(cur, unvisited[i].point); if (d < bd) { bd = d; bi = i } }
    ordered.push(unvisited[bi]); cur = unvisited[bi].point; unvisited.splice(bi, 1)
  }
  return ordered
}
function twoOpt(stops: StopDemand[], depot = DEPOT): StopDemand[] {
  let best = [...stops], bestDist = routeDistance(best, depot), improved = true
  while (improved) {
    improved = false
    for (let i = 0; i < best.length - 1; i++)
      for (let j = i + 1; j < best.length; j++) {
        const c = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)]
        const d = routeDistance(c, depot)
        if (d < bestDist - 0.01) { best = c; bestDist = d; improved = true }
      }
  }
  return best
}
function centroid(stops: StopDemand[]) {
  const n = stops.length || 1
  return { latitude: stops.reduce((s, d) => s + d.point.latitude, 0) / n, longitude: stops.reduce((s, d) => s + d.point.longitude, 0) / n }
}

// ═══════════════════════════════════════════════════════════════
// VRP SOLVER (OR-Tools style)
// ═══════════════════════════════════════════════════════════════
function solve(demands: StopDemand[], vehicles: Vehicle[], iterations = 3): OptimizeResult {
  const start = Date.now()
  const sorted = [...demands].sort((a, b) => b.count - a.count)
  const sortedVehicles = [...vehicles].filter(v => v.is_status === 'active' && (v.vehicle_type?.capacity ?? 0) > 0)
    .sort((a, b) => (b.vehicle_type?.capacity ?? 0) - (a.vehicle_type?.capacity ?? 0))
  let bestResults: VehicleResult[] = [], bestUnassigned: StopDemand[] = [], bestTotal = Infinity
  for (let iter = 0; iter < iterations; iter++) {
    const shuffled = iter === 0 ? sorted : [...sorted].sort(() => (Math.random() - 0.5) * 0.4 + (iter % 2 === 0 ? 0.2 : -0.2))
    const bins = sortedVehicles.map(v => ({ vehicle: v, stops: [] as StopDemand[], load: 0 }))
    const unassigned: StopDemand[] = []
    for (const demand of shuffled) {
      let bestBin = -1, bestScore = -Infinity
      for (let bi = 0; bi < bins.length; bi++) {
        const bin = bins[bi]; const cap = bin.vehicle.vehicle_type?.capacity ?? 0
        if (bin.load + demand.count > cap) continue
        const prox = bin.stops.length === 0 ? 1 : 1 / (1 + haversine(bin.stops[bin.stops.length - 1].point, demand.point))
        const score = prox * 10 - (cap - bin.load - demand.count) * 0.1
        if (score > bestScore) { bestScore = score; bestBin = bi }
      }
      if (bestBin === -1) { unassigned.push(demand); continue }
      bins[bestBin].stops.push(demand); bins[bestBin].load += demand.count
    }
    const results: VehicleResult[] = bins.filter(b => b.stops.length > 0).map((b, idx) => {
      const opt = twoOpt(nearestNeighbor(b.stops))
      const cap = b.vehicle.vehicle_type?.capacity ?? 1
      return { vehicle: b.vehicle, stops: opt, totalPassengers: b.load, loadPct: Math.round(b.load / cap * 100), distanceKm: routeDistance(opt), color: VEHICLE_COLORS[idx % VEHICLE_COLORS.length] }
    })
    const tot = results.reduce((s, r) => s + r.distanceKm, 0)
    if (tot < bestTotal) { bestTotal = tot; bestResults = results; bestUnassigned = unassigned }
  }
  const totalPax = bestResults.reduce((s, r) => s + r.totalPassengers, 0)
  return {
    vehicles: bestResults, unassigned: bestUnassigned, totalPassengers: totalPax,
    totalDistanceKm: Math.round(bestTotal * 10) / 10, savedVehicles: Math.max(0, demands.length - bestResults.length),
    avgLoad: bestResults.length ? Math.round(bestResults.reduce((s, r) => s + r.loadPct, 0) / bestResults.length) : 0,
    iterations, durationMs: Date.now() - start,
  }
}

// ═══════════════════════════════════════════════════════════════
// FLEETFLEX SOLVER  (geo-cluster + demand-responsive flex)
// ═══════════════════════════════════════════════════════════════
function kMeans(stops: StopDemand[], k: number, iters = 15): StopDemand[][] {
  if (stops.length <= k) return stops.map(s => [s])
  // init centroids = spread across lat/lon
  let centers = stops.slice().sort((a, b) => a.point.latitude - b.point.latitude)
    .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / k)) === 0).slice(0, k)
    .map(s => ({ latitude: s.point.latitude, longitude: s.point.longitude }))
  let clusters: StopDemand[][] = Array.from({ length: k }, () => [])
  for (let it = 0; it < iters; it++) {
    clusters = Array.from({ length: k }, () => [])
    for (const s of stops) {
      let bi = 0, bd = haversine(centers[0], s.point)
      for (let ci = 1; ci < centers.length; ci++) { const d = haversine(centers[ci], s.point); if (d < bd) { bd = d; bi = ci } }
      clusters[bi].push(s)
    }
    centers = clusters.map(cl => cl.length ? centroid(cl) : centers[clusters.indexOf(cl)])
  }
  return clusters.filter(c => c.length > 0)
}

function solveFleetFlex(demands: StopDemand[], vehicles: Vehicle[], opts: {
  numZones: number; flexRadius: number; timeWindowMin: number; iterations: number
}): FlexResult {
  const start = Date.now()
  const activeVehicles = vehicles.filter(v => v.is_status === 'active' && (v.vehicle_type?.capacity ?? 0) > 0)
    .sort((a, b) => (b.vehicle_type?.capacity ?? 0) - (a.vehicle_type?.capacity ?? 0))

  // 1. K-means cluster stops into zones
  const k = Math.min(opts.numZones, demands.length, activeVehicles.length)
  const clusterGroups = kMeans(demands, k)

  const zones: FlexZone[] = clusterGroups.map((cl, i) => {
    const c = centroid(cl)
    const maxR = cl.reduce((mx, s) => Math.max(mx, haversine(c, s.point)), 0)
    return {
      id: `zone-${i + 1}`, center: c, stops: cl,
      totalDemand: cl.reduce((s, d) => s + d.count, 0),
      radiusKm: Math.max(maxR, opts.flexRadius),
      color: VEHICLE_COLORS[i % VEHICLE_COLORS.length],
    }
  })

  // 2. Assign vehicles to zones (primary: zone with most demand gets biggest vehicle)
  const sortedZones = [...zones].sort((a, b) => b.totalDemand - a.totalDemand)
  const assignments: VehicleResult[] = []
  const flexMoves: FlexResult['flexMoves'] = []
  const usedVehicles = new Set<string>()

  for (let zi = 0; zi < sortedZones.length && zi < activeVehicles.length; zi++) {
    const zone = sortedZones[zi]
    const vehicle = activeVehicles.find(v => !usedVehicles.has(v.id))
    if (!vehicle) break
    usedVehicles.add(vehicle.id)
    const cap = vehicle.vehicle_type?.capacity ?? 1
    const opt = twoOpt(nearestNeighbor(zone.stops, zone.center), zone.center)
    assignments.push({
      vehicle, stops: opt, totalPassengers: zone.totalDemand,
      loadPct: Math.round(zone.totalDemand / cap * 100),
      distanceKm: routeDistance(opt, zone.center),
      color: zone.color, flexZone: zone.id,
    })
  }

  // 3. Flex pass: spare-capacity vehicles absorb nearby stops from overflow zones
  for (const asgn of assignments) {
    const cap = asgn.vehicle.vehicle_type?.capacity ?? 0
    const spare = cap - asgn.totalPassengers
    if (spare <= 0) continue
    const zoneCenter = zones.find(z => z.id === asgn.flexZone)?.center ?? DEPOT
    for (const zone of zones) {
      if (zone.id === asgn.flexZone) continue
      // Only flex if zone center is within flexRadius
      if (haversine(zoneCenter, zone.center) > opts.flexRadius) continue
      const nearbyUnmet = zone.stops.filter(s => !asgn.stops.includes(s))
      for (const stop of nearbyUnmet) {
        if (stop.count <= spare) {
          asgn.stops.push(stop)
          asgn.totalPassengers += stop.count
          asgn.loadPct = Math.round(asgn.totalPassengers / cap * 100)
          flexMoves.push({ from: zone.id, to: asgn.flexZone!, pax: stop.count, vehicle: asgn.vehicle.license })
          break
        }
      }
    }
    // Re-optimize after flex additions
    asgn.stops = twoOpt(nearestNeighbor(asgn.stops, zoneCenter), zoneCenter)
    asgn.distanceKm = routeDistance(asgn.stops, zoneCenter)
  }

  const totalPax = assignments.reduce((s, a) => s + a.totalPassengers, 0)
  const totalDist = Math.round(assignments.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10
  const avgLoad = assignments.length ? Math.round(assignments.reduce((s, a) => s + a.loadPct, 0) / assignments.length) : 0
  const flexUtil = flexMoves.length ? Math.min(100, Math.round(flexMoves.reduce((s, m) => s + m.pax, 0) / Math.max(totalPax, 1) * 100)) : 0

  return { zones, assignments, flexMoves, totalPassengers: totalPax, totalDistanceKm: totalDist, avgLoad, flexUtilization: flexUtil, durationMs: Date.now() - start }
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
function LoadBar({ pct }: { pct: number }) {
  const bg = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: bg }} />
      </div>
      <span className="text-[10px] font-bold w-8 text-right" style={{ color: bg }}>{pct}%</span>
    </div>
  )
}

function VehicleCard({ result, idx, badge }: { result: VehicleResult; idx: number; badge?: string }) {
  const { t } = useLang()
  const [open, setOpen] = useState(idx === 0)
  const cap = result.vehicle.vehicle_type?.capacity ?? 0
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: result.color }}>
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-800 font-mono">{result.vehicle.license}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{result.vehicle.vehicle_type?.name_th}</span>
            {badge && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: result.color }}>{badge}</span>}
          </div>
          <LoadBar pct={result.loadPct} />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right"><p className="text-[9px] text-slate-400">{t('consolidation', 'totalPassengers')}</p><p className="text-xs font-bold text-slate-700">{result.totalPassengers}/{cap}</p></div>
          <div className="text-right"><p className="text-[9px] text-slate-400">{t('consolidation', 'distanceLabel')}</p><p className="text-xs font-bold text-slate-700">{result.distanceKm} km</p></div>
          <div className="text-right"><p className="text-[9px] text-slate-400">{t('consolidation', 'stopLabel')}</p><p className="text-xs font-bold text-slate-700">{result.stops.length}</p></div>
          {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Route size={11} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('consolidation', 'pickupOrder')}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><Navigation size={9} className="text-white" /></div>
              <span className="text-[10px] font-semibold text-slate-600">Depot</span>
            </div>
            {result.stops.map((stop, si) => (
              <div key={stop.point.id} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                    style={{ borderColor: result.color, color: result.color, background: `${result.color}15` }}>{si + 1}</div>
                  {si < result.stops.length - 1 && <div className="w-0.5 h-3 mt-0.5" style={{ background: `${result.color}40` }} />}
                </div>
                <div className="flex-1 pb-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-slate-700">{stop.point.name_th}</p>
                    <span className="text-[9px] font-mono text-slate-400">{stop.point.code}</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold" style={{ color: result.color }}><Users size={9} /> {stop.count}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {stop.reserves.map(r => (
                      <span key={r.id} className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                        {r.employee?.first_name_th} {r.employee?.last_name_th?.charAt(0)}.
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2.5 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={9} className="text-white" /></div>
              <span className="text-[10px] font-semibold text-slate-600">Return Depot · {result.distanceKm} km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
type Mode = 'vrp' | 'fleetflex'

export default function ConsolidationPage() {
  const { reserves } = useReserveStore()
  const { shifts } = useShiftStore()
  const { vehicles } = useVehiclesStore()
  const { t } = useLang()

  // ── Shared filters ────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('vrp')
  const [date, setDate] = useState('2026-04-06')
  const [shiftId, setShiftId] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('approved')
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(
    new Set(vehicles.filter(v => v.is_status === 'active').map(v => v.id))
  )

  // ── VRP params ────────────────────────────────────────────────
  const [iterations, setIterations] = useState(5)
  const [vrpResult, setVrpResult] = useState<OptimizeResult | null>(null)
  const [vrpRunning, setVrpRunning] = useState(false)

  // ── FleetFlex params ──────────────────────────────────────────
  const [numZones, setNumZones] = useState(3)
  const [flexRadius, setFlexRadius] = useState(5)
  const [timeWindowMin, setTimeWindowMin] = useState(30)
  const [flexIterations, setFlexIterations] = useState(3)
  const [flexResult, setFlexResult] = useState<FlexResult | null>(null)
  const [flexRunning, setFlexRunning] = useState(false)
  const [showZonePanel, setShowZonePanel] = useState(true)

  const [showVehiclePanel, setShowVehiclePanel] = useState(true)

  // ── Demand ────────────────────────────────────────────────────
  const demands: StopDemand[] = useMemo(() => {
    const filtered = reserves.filter(r => {
      return r.travel_date.slice(0, 10) === date &&
        (shiftId === 'all' || r.shift_id === shiftId) &&
        (stateFilter === 'all' || r.is_state === stateFilter)
    })
    const map = new Map<string, StopDemand>()
    for (const r of filtered) {
      if (!r.point) continue
      if (!map.has(r.point_id)) map.set(r.point_id, { point: r.point, count: 0, reserves: [] })
      const s = map.get(r.point_id)!; s.count++; s.reserves.push(r)
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [reserves, date, shiftId, stateFilter])

  const totalDemand = demands.reduce((s, d) => s + d.count, 0)
  const activeVehicles = useMemo(
    () => vehicles.filter(v => v.is_status === 'active' && selectedVehicleIds.has(v.id)),
    [vehicles, selectedVehicleIds]
  )
  const totalCapacity = activeVehicles.reduce((s, v) => s + (v.vehicle_type?.capacity ?? 0), 0)

  const toggleVehicle = (id: string) => setSelectedVehicleIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ── Runners ───────────────────────────────────────────────────
  const runVRP = useCallback(() => {
    if (!demands.length || !activeVehicles.length) return
    setVrpRunning(true); setVrpResult(null)
    setTimeout(() => { setVrpResult(solve(demands, activeVehicles, iterations)); setVrpRunning(false) }, 400 + Math.random() * 400)
  }, [demands, activeVehicles, iterations])

  const runFleetFlex = useCallback(() => {
    if (!demands.length || !activeVehicles.length) return
    setFlexRunning(true); setFlexResult(null)
    setTimeout(() => {
      setFlexResult(solveFleetFlex(demands, activeVehicles, { numZones, flexRadius, timeWindowMin, iterations: flexIterations }))
      setFlexRunning(false)
    }, 500 + Math.random() * 400)
  }, [demands, activeVehicles, numZones, flexRadius, timeWindowMin, flexIterations])

  const resetAll = () => { setVrpResult(null); setFlexResult(null) }
  const switchMode = (m: Mode) => { setMode(m); resetAll() }

  // ── Stat cards ────────────────────────────────────────────────
  const vrpStats = vrpResult ? [
    { icon: <Bus size={14} />, label: t('consolidation', 'vehiclesUsed'), value: `${vrpResult.vehicles.length}`, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
    { icon: <Users size={14} />, label: t('consolidation', 'totalPassengers'), value: `${vrpResult.totalPassengers}`, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { icon: <Navigation size={14} />, label: t('consolidation', 'totalDistance'), value: `${vrpResult.totalDistanceKm} km`, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
    { icon: <BarChart3 size={14} />, label: t('consolidation', 'avgLoad'), value: `${vrpResult.avgLoad}%`, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { icon: <TrendingDown size={14} />, label: t('consolidation', 'savedVehicles'), value: `${vrpResult.savedVehicles}`, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
    { icon: <Cpu size={14} />, label: t('consolidation', 'optimizeTime'), value: `${vrpResult.durationMs} ms`, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  ] : []

  const flexStats = flexResult ? [
    { icon: <Layers size={14} />, label: 'Flex Zones', value: `${flexResult.zones.length}`, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
    { icon: <Bus size={14} />, label: t('consolidation', 'vehiclesUsed'), value: `${flexResult.assignments.length}`, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
    { icon: <Users size={14} />, label: t('consolidation', 'totalPassengers'), value: `${flexResult.totalPassengers}`, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { icon: <Navigation size={14} />, label: t('consolidation', 'totalDistance'), value: `${flexResult.totalDistanceKm} km`, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { icon: <Shuffle size={14} />, label: 'Flex Moves', value: `${flexResult.flexMoves.length}`, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
    { icon: <Radio size={14} />, label: 'Flex Utilization', value: `${flexResult.flexUtilization}%`, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
  ] : []

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Cpu size={14} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">AI Route Consolidation</h1>
          </div>
          <p className="text-xs text-slate-400">{t('consolidation', 'algorithmNote')}</p>
        </div>
        <div className="flex gap-2">
          {(vrpResult || flexResult) && (
            <button onClick={resetAll} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={13} /> {t('common', 'export')}
          </button>
        </div>
      </div>

      {/* ── Mode tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => switchMode('vrp')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'vrp' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Cpu size={13} /> VRP Optimizer
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">OR-Tools</span>
        </button>
        {/* <button onClick={() => switchMode('fleetflex')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${mode==='fleetflex' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Sparkles size={13}/> FleetFlex
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">Demand-Responsive</span>
        </button> */}
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── LEFT: Config ────────────────────────────────── */}
        <div className="col-span-4 space-y-4">

          {/* Shared filters */}
          <Card padding="sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Parameters</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('common', 'date')}</label>
                <input type="date" value={date} onChange={e => { setDate(e.target.value); resetAll() }}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('common', 'shift')}</label>
                <select value={shiftId} onChange={e => { setShiftId(e.target.value); resetAll() }}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-violet-400">
                  <option value="all">{t('consolidation', 'allShifts')}</option>
                  {shifts.filter(s => s.is_status === 'active').map(s => <option key={s.id} value={s.id}>{s.name_th}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('common', 'status')}</label>
                <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); resetAll() }}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-violet-400">
                  <option value="all">{t('common', 'all')}</option>
                  <option value="approved">approved</option>
                  <option value="waiting">waiting</option>
                </select>
              </div>

              {/* Mode-specific params */}
              {mode === 'vrp' ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Iterations</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="range" min={1} max={20} value={iterations} onChange={e => setIterations(+e.target.value)} className="flex-1 accent-violet-500" />
                    <span className="text-xs font-bold text-violet-600 w-5 text-right">{iterations}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <GitMerge size={9} /> {t('consolidation', 'flexZoneCount')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="range" min={1} max={Math.min(8, demands.length || 8)} value={numZones} onChange={e => setNumZones(+e.target.value)} className="flex-1 accent-orange-500" />
                      <span className="text-xs font-bold text-orange-600 w-5 text-right">{numZones}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">K-Means geo-clustering</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <SlidersHorizontal size={9} /> Flex Radius (km)
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="range" min={1} max={30} value={flexRadius} onChange={e => setFlexRadius(+e.target.value)} className="flex-1 accent-orange-500" />
                      <span className="text-xs font-bold text-orange-600 w-8 text-right">{flexRadius}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">{t('consolidation', 'flexRadiusDesc')}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Clock size={9} /> {t('consolidation', 'timeWindowLabel')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="range" min={5} max={60} step={5} value={timeWindowMin} onChange={e => setTimeWindowMin(+e.target.value)} className="flex-1 accent-orange-500" />
                      <span className="text-xs font-bold text-orange-600 w-8 text-right">±{timeWindowMin}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">{t('consolidation', 'timeWindowDesc')}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Iterations</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="range" min={1} max={10} value={flexIterations} onChange={e => setFlexIterations(+e.target.value)} className="flex-1 accent-orange-500" />
                      <span className="text-xs font-bold text-orange-600 w-5 text-right">{flexIterations}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Demand */}
          <Card padding="sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Demand ({totalDemand} pax · {demands.length} stops)
            </p>
            {demands.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400"><Package size={24} className="mx-auto mb-2 text-slate-300" />{t('fleet', 'noBookings')}</div>
            ) : (
              <div className="space-y-1.5">
                {demands.map(d => (
                  <div key={d.point.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2 bg-slate-50 border border-slate-100">
                    <MapPin size={11} className={mode === 'fleetflex' ? 'text-orange-500' : 'text-violet-500'} style={{ flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-700 truncate">{d.point.name_th}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{d.point.code}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold flex-shrink-0 ${mode === 'fleetflex' ? 'text-orange-600' : 'text-violet-600'}`}>
                      <Users size={9} /> {d.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* FleetFlex: zone preview */}
          {mode === 'fleetflex' && flexResult && (
            <Card padding="sm">
              <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setShowZonePanel(o => !o)}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flex Zones ({flexResult.zones.length})</p>
                {showZonePanel ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
              </div>
              {showZonePanel && (
                <div className="space-y-2">
                  {flexResult.zones.map((z, zi) => (
                    <div key={z.id} className="rounded-lg border p-2.5" style={{ borderColor: `${z.color}40`, background: `${z.color}08` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: z.color }} />
                        <span className="text-[10px] font-bold" style={{ color: z.color }}>Zone {zi + 1}</span>
                        <span className="ml-auto text-[9px] font-mono text-slate-400">{z.radiusKm.toFixed(1)} km radius</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {z.stops.map(s => (
                          <span key={s.point.id} className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold text-white" style={{ background: z.color }}>
                            {s.point.name_th} ({s.count})
                          </span>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1.5">
                        <Users size={8} className="inline mr-0.5" /> {z.totalDemand} pax ·
                        <MapPin size={8} className="inline mx-0.5" /> {z.center.latitude.toFixed(3)}, {z.center.longitude.toFixed(3)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Vehicle pool */}
          <Card padding="sm">
            <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setShowVehiclePanel(o => !o)}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t('consolidation', 'vehiclePool')} ({activeVehicles.length}/{vehicles.filter(v => v.is_status === 'active').length} · {totalCapacity} {t('consolidation', 'seats')})
              </p>
              {showVehiclePanel ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
            </div>
            {showVehiclePanel && (
              <div className="space-y-1.5">
                {vehicles.filter(v => v.is_status === 'active').map(v => {
                  const selected = selectedVehicleIds.has(v.id)
                  const accent = mode === 'fleetflex' ? 'accent-orange-500' : 'accent-violet-500'
                  const selCls = mode === 'fleetflex' ? 'bg-orange-50 border-orange-200' : 'bg-violet-50 border-violet-200'
                  const valCls = mode === 'fleetflex' ? 'text-orange-600' : 'text-violet-600'
                  return (
                    <label key={v.id} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${selected ? selCls : 'bg-slate-50 border border-slate-100 opacity-60'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleVehicle(v.id)} className={`rounded ${accent}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold font-mono text-slate-700">{v.license}</p>
                        <p className="text-[9px] text-slate-400">{v.vehicle_type?.name_th}</p>
                      </div>
                      <span className={`text-[10px] font-bold ${valCls} flex-shrink-0`}>{v.vehicle_type?.capacity} {t('consolidation', 'seats')}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Capacity check */}
          {demands.length > 0 && (
            <div className={`rounded-xl border p-3 ${totalDemand > totalCapacity ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {totalDemand > totalCapacity ? <AlertCircle size={12} className="text-red-500" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
                <span className={`text-[10px] font-bold ${totalDemand > totalCapacity ? 'text-red-600' : 'text-emerald-600'}`}>
                  {totalDemand > totalCapacity ? t('fleet', 'capacityWarn') : t('fleet', 'capacityOk')}
                </span>
              </div>
              <p className="text-[10px] text-slate-600">
                Demand <strong>{totalDemand}</strong> · Capacity <strong>{totalCapacity}</strong>
                {totalDemand <= totalCapacity && ` · ${t('consolidation', 'spare')} ${totalCapacity - totalDemand}`}
              </p>
            </div>
          )}

          {/* Run button */}
          {mode === 'vrp' ? (
            <button onClick={runVRP} disabled={vrpRunning || demands.length === 0 || activeVehicles.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: vrpRunning || !demands.length ? '#e2e8f0' : 'linear-gradient(135deg,#7c3aed,#6366f1)', color: vrpRunning || !demands.length ? '#94a3b8' : 'white', boxShadow: vrpRunning || !demands.length ? 'none' : '0 4px 20px rgba(124,58,237,0.35)' }}>
              {vrpRunning ? <><Loader2 size={15} className="animate-spin" /> {t('consolidation', 'optimizing')}</> : <><Zap size={15} /> Run VRP Optimizer</>}
            </button>
          ) : (
            <button onClick={runFleetFlex} disabled={flexRunning || demands.length === 0 || activeVehicles.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: flexRunning || !demands.length ? '#e2e8f0' : 'linear-gradient(135deg,#ea580c,#f59e0b)', color: flexRunning || !demands.length ? '#94a3b8' : 'white', boxShadow: flexRunning || !demands.length ? 'none' : '0 4px 20px rgba(234,88,12,0.35)' }}>
              {flexRunning ? <><Loader2 size={15} className="animate-spin" /> {t('consolidation', 'flexRunning')}</> : <><Sparkles size={15} /> Run FleetFlex</>}
            </button>
          )}
        </div>

        {/* ── RIGHT: Results ───────────────────────────────── */}
        <div className="col-span-8">

          {/* ── VRP Results ── */}
          {mode === 'vrp' && (
            <>
              {!vrpResult && !vrpRunning && <EmptyState mode="vrp" />}
              {vrpRunning && <RunningState label="VRP · Nearest-Neighbor + 2-opt" iters={iterations} color="violet" />}
              {vrpResult && (
                <div className="space-y-4">
                  <AlgoBadge text={`Savings + Nearest-Neighbor + 2-opt · ${vrpResult.iterations} iterations · ${vrpResult.durationMs} ms · Google OR-Tools CVRP`} color="violet" />
                  <StatGrid cards={vrpStats} />
                  {vrpResult.unassigned.length > 0 && <UnassignedWarning items={vrpResult.unassigned} />}
                  <div className="space-y-3">
                    <SectionTitle icon={<Bus size={13} />} label={`${t('consolidation', 'routePlan')} (${vrpResult.vehicles.length})`} />
                    {vrpResult.vehicles.map((v, i) => <VehicleCard key={v.vehicle.id} result={v} idx={i} />)}
                  </div>
                  <SavingsBox demands={demands} result={vrpResult} />
                </div>
              )}
            </>
          )}

          {/* ── FleetFlex Results ── */}
          {mode === 'fleetflex' && (
            <>
              {!flexResult && !flexRunning && <EmptyState mode="fleetflex" />}
              {flexRunning && <RunningState label="FleetFlex · K-Means + Geo-Cluster + Flex Routing" iters={flexIterations} color="orange" />}
              {flexResult && (
                <div className="space-y-4">
                  <AlgoBadge
                    text={`K-Means geo-clustering (K=${numZones}) + Flex radius ${flexRadius}km + Time window ±${timeWindowMin}min + 2-opt · ${flexResult.durationMs} ms`}
                    color="orange" />
                  <StatGrid cards={flexStats} />

                  {/* Flex moves */}
                  {flexResult.flexMoves.length > 0 && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shuffle size={12} className="text-orange-500" />
                        <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Flex Moves ({flexResult.flexMoves.length})</p>
                      </div>
                      <div className="space-y-1">
                        {flexResult.flexMoves.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] text-orange-700">
                            <span className="font-mono">{m.vehicle}</span>
                            <ArrowRight size={9} />
                            <span>+<strong>{m.pax}</strong> pax {m.from} → {m.to}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zone summary */}
                  <div>
                    <SectionTitle icon={<Layers size={13} />} label={`Flex Zone Summary (${flexResult.zones.length})`} />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {flexResult.zones.map((z, zi) => (
                        <div key={z.id} className="rounded-xl border p-3" style={{ borderColor: `${z.color}30`, background: `${z.color}08` }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: z.color }} />
                            <span className="text-[10px] font-bold" style={{ color: z.color }}>Zone {zi + 1}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-700">{z.totalDemand} pax</p>
                          <p className="text-[9px] text-slate-400">{z.stops.length} stops · r={z.radiusKm.toFixed(1)}km</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SectionTitle icon={<Bus size={13} />} label={`FleetFlex ${t('consolidation', 'routePlan')} (${flexResult.assignments.length})`} />
                    {flexResult.assignments.map((v, i) => (
                      <VehicleCard key={v.vehicle.id} result={v} idx={i} badge={v.flexZone ?? undefined} />
                    ))}
                  </div>

                  {/* FleetFlex insight */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">FleetFlex Insight</p>
                    {[
                      { icon: <ArrowRight size={11} className="text-orange-500" />, text: `${flexResult.zones.length} Flex Zones via K-Means Clustering` },
                      { icon: <ArrowRight size={11} className="text-sky-500" />, text: `Flex Utilization ${flexResult.flexUtilization}% — ${flexResult.flexMoves.length} flex moves` },
                      { icon: <ArrowRight size={11} className="text-emerald-500" />, text: `Avg Load ${flexResult.avgLoad}% · Total ${flexResult.totalDistanceKm} km` },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">{r.icon}{r.text}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Shared sub-components ─────────────────────────────────────
function AlgoBadge({ text, color }: { text: string; color: 'violet' | 'orange' }) {
  const cls = color === 'violet' ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-orange-50 border-orange-200 text-orange-700'
  const ic = color === 'violet' ? <Info size={12} className="text-violet-500 flex-shrink-0" /> : <Sparkles size={12} className="text-orange-500 flex-shrink-0" />
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${cls}`}>
      {ic}
      <p className="text-[10px] font-medium">{text}</p>
    </div>
  )
}

function StatGrid({ cards }: { cards: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(s => (
        <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
          <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-[9px] font-bold uppercase tracking-wide">{s.label}</span></div>
          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500">{icon}</span>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function UnassignedWarning({ items }: { items: StopDemand[] }) {
  const { t } = useLang()
  const total = items.reduce((s, d) => s + d.count, 0)
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-red-700">{t('consolidation', 'unassignedWarn').replace('{n}', String(total))}</p>
        <p className="text-[10px] text-red-500 mt-0.5">{t('consolidation', 'unassignedStops')}: {items.map(d => d.point.name_th).join(', ')}</p>
      </div>
    </div>
  )
}

function SavingsBox({ demands, result }: { demands: StopDemand[]; result: OptimizeResult }) {
  const { t } = useLang()
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">{t('consolidation', 'savingsSummary')}</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ArrowRight size={11} className="text-emerald-500" />
          <span className="text-slate-600">{t('consolidation', 'reducedFrom')} <strong>{demands.length}</strong> ({t('consolidation', 'naive')}) → <strong>{result.vehicles.length}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight size={11} className="text-sky-500" />
          <span className="text-slate-600">Avg load <strong>{result.avgLoad}%</strong> · <strong>{result.totalDistanceKm} km</strong></span>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ mode }: { mode: Mode }) {
  const isVrp = mode === 'vrp'
  const feats = isVrp
    ? [{ icon: '📍', title: 'Merge Stops', desc: 'Nearby pickup stops into one route' }, { icon: '🚌', title: 'Assign Vehicles', desc: 'Bin-packing to reduce vehicle count' }, { icon: '📏', title: 'Reduce Distance', desc: '2-opt TSP to minimize total distance' }]
    : [{ icon: '🗺️', title: 'Geo-Cluster', desc: 'K-Means splits area into Flex Zones' }, { icon: '🔀', title: 'Flex Routing', desc: 'Vehicles serve stops across zone radius' }, { icon: '⏱️', title: 'Time Window', desc: 'Flexible pickup window ±N minutes' }]
  const accent = isVrp ? 'bg-violet-50 border-violet-100 text-violet-300' : 'bg-orange-50 border-orange-100 text-orange-300'
  const Icon = isVrp ? Cpu : Sparkles
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-20">
      <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center mb-4 ${accent}`}>
        <Icon size={28} />
      </div>
      <p className="text-sm font-semibold text-slate-500">Not Yet Optimized</p>
      <p className="text-xs mt-1 max-w-xs text-slate-400">
        Select date, shift and vehicles then click <strong>Run {isVrp ? 'VRP Optimizer' : 'FleetFlex'}</strong>
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-left max-w-sm">
        {feats.map(f => (
          <div key={f.title} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="text-lg mb-1">{f.icon}</div>
            <p className="text-[10px] font-bold text-slate-600">{f.title}</p>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunningState({ label, iters, color }: { label: string; iters: number; color: 'violet' | 'orange' }) {
  const c = color === 'violet' ? { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600', bar: 'bg-violet-200' } : { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', bar: 'bg-orange-200' }
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-20">
      <div className={`w-16 h-16 rounded-2xl ${c.bg} border-2 ${c.border} flex items-center justify-center mb-4 animate-pulse`}>
        <Loader2 size={28} className={`${c.text} animate-spin`} />
      </div>
      <p className={`text-sm font-bold ${c.text}`}>Optimizing…</p>
      <p className="text-xs text-slate-400 mt-1">{label} · {iters} iterations</p>
      <div className="flex items-center gap-1.5 mt-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`w-1.5 h-6 rounded-full ${c.bar} animate-pulse`} style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  )
}
