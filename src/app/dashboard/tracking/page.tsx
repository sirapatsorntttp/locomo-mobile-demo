'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Navigation, Bus, Clock, Radio, Activity, RefreshCw,
  Users, UserCheck, MapPin, Gauge, ChevronRight, Filter,
  LocateFixed, Eye, EyeOff, Layers, Signal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import { usePostStore } from '@/lib/stores/post.store'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useAttendanceStore } from '@/lib/stores/attendance.store'

const LONGDO_MAP_KEY = 'e516b73dc9f6e987181a591230bbe207'

// Vehicle color palette per post index
const ROUTE_COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899']

const FACTORY = { lat: 13.8361, lon: 100.5231 }

// Simulated start positions (different areas of Bangkok)
const ROUTE_STARTS = [
  { lat: 13.7150, lon: 100.4380 }, // south-west
  { lat: 13.8050, lon: 100.4720 }, // north-west
  { lat: 13.6850, lon: 100.5620 }, // south-east
  { lat: 13.7600, lon: 100.6100 }, // east
  { lat: 13.8500, lon: 100.5900 }, // north-east
]

const getVehiclePos = (idx: number, nowM: number, shiftMin: number) => {
  const start = ROUTE_STARTS[idx % ROUTE_STARTS.length]
  const elapsed  = Math.max(0, nowM - shiftMin + 30)
  const progress = Math.min(1, elapsed / 60)
  return {
    lat: start.lat + (FACTORY.lat - start.lat) * progress + Math.sin(idx * 2.7 + nowM * 0.01) * 0.003,
    lon: start.lon + (FACTORY.lon - start.lon) * progress + Math.cos(idx * 1.9 + nowM * 0.01) * 0.003,
    speed: 35 + Math.sin(idx * 1.3 + nowM * 0.05) * 20,
    heading: 45 + idx * 30,
    progress,
  }
}

const nowMin  = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }
const toMin   = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const clockStr = () => new Date().toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })

type LMap    = LongdoMap
type LMarker = LongdoMarker

// ─── Component ───────────────────────────────────────────────
export default function TrackingPage() {
  const {   attendances } = useAttendanceStore()
  const{driverVehicles} =useDriverStore()
  const {posts} = usePostStore()
  const { routes } = useRoutePointStore()
  const { t } = useLang()
  const activePosts = useMemo(() => posts.filter(p => p.is_status === 'active'), [posts])

  const [tick, setTick]               = useState(0)
  const [clock, setClock]             = useState('--:--:--')
  const [nowM, setNowM]               = useState(0)
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [showLabels, setShowLabels]   = useState(true)
  const [followSelected, setFollow]   = useState(false)
  const [filterRoute, setFilterRoute] = useState<string>('all')

  useEffect(() => {
    setClock(clockStr()); setNowM(nowMin())
    const t = setInterval(() => {
      setTick(x => x + 1); setClock(clockStr()); setNowM(nowMin())
    }, 2000)
    return () => clearInterval(t)
  }, [])

  // Compute live positions
  const vehicles = useMemo(() => activePosts.map((post, idx) => {
    const dv      = driverVehicles.find(v => v.id === post.driver_vehicle_vendor?.driver_vehicle_id)
    const pax     = attendances.filter(a => a.post_id === post.id).length
    const cap     = dv?.vehicle?.vehicle_type?.capacity ?? 12
    const shiftM  = toMin(post.shift?.default_time ?? '07:00')
    const pos     = getVehiclePos(idx, nowM, shiftM)
    const color   = ROUTE_COLORS[idx % ROUTE_COLORS.length]
    const isSelected = selectedId === post.id
    return { post, dv, pax, cap, pos, color, isSelected, idx }
  }), [activePosts, driverVehicles, attendances, nowM, selectedId])

  const filtered = useMemo(() =>
    filterRoute === 'all' ? vehicles : vehicles.filter(v => v.post.route_id === filterRoute),
    [vehicles, filterRoute]
  )

  const selected = vehicles.find(v => v.post.id === selectedId)

  // ── Longdo Map ───────────────────────────────────────────────
  const mapElRef   = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<LMap | null>(null)
  const markersRef = useRef<Map<string, LMarker>>(new Map())
  const factoryRef = useRef<LMarker | null>(null)

  const buildBusHtml = (v: typeof vehicles[0]) => {
    const occ = v.cap > 0 ? Math.round((v.pax / v.cap) * 100) : 0
    const occColor = occ > 90 ? '#ef4444' : occ > 60 ? '#f59e0b' : '#10b981'
    return `<div style="
      display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;
      transform:${v.isSelected ? 'scale(1.3)' : 'scale(1)'};transition:transform 0.2s;
    ">
      <div style="
        background:${v.color};border:2.5px solid white;border-radius:10px;
        padding:4px 8px;color:white;font-size:10px;font-weight:700;font-family:monospace;
        box-shadow:0 3px 10px rgba(0,0,0,0.3);white-space:nowrap;
        display:flex;align-items:center;gap:5px;
      ">
        🚌 ${v.dv?.vehicle?.license ?? v.post.code}
        ${v.isSelected ? '<span style="background:white;color:'+v.color+';border-radius:4px;padding:1px 4px;font-size:9px;">●</span>' : ''}
      </div>
      ${showLabels ? `<div style="background:white;border:1px solid ${v.color};border-radius:6px;padding:2px 6px;font-size:9px;color:#334155;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.15);">
        ${v.pax}/${v.cap} · ${Math.round(v.pos.speed)}km/h
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${occColor};margin-left:3px;vertical-align:middle;"></span>
      </div>` : ''}
    </div>`
  }

  const initMap = useCallback(() => {
    if (!mapElRef.current || !window.longdo || mapRef.current) return
    const map = new window.longdo.Map({
      placeholder: mapElRef.current,
      zoom: 11, lastView: false,
      location: { lat: 13.77, lon: 100.51 },
    })
    mapRef.current = map

    // Factory marker
    const fac = new window.longdo.Marker(FACTORY, { icon: {
      html: `<div style="background:#0f172a;color:white;padding:5px 10px;border-radius:10px;font-size:10px;font-weight:700;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);white-space:nowrap;">🏭 Factory / Depot</div>`,
      offset: { x: 55, y: 20 },
    }})
    map.Overlays.add(fac)
    factoryRef.current = fac

    // Click-to-select vehicle
    map.Event.bind('click', () => { /* handled by marker click */ })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as Window & typeof globalThis).longdo) { initMap(); return }
    const existing = document.querySelector(`script[src*="longdo.com"]`)
    if (existing) { existing.addEventListener('load', initMap); return }
    const s = document.createElement('script')
    s.src = `https://api.longdo.com/map/?key=${LONGDO_MAP_KEY}`
    s.async = true; s.onload = initMap
    document.head.appendChild(s)
    return () => { s.onload = null }
  }, [initMap])

  // Update markers on tick
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.longdo) return

    filtered.forEach(v => {
      const ex = markersRef.current.get(v.post.id)
      if (ex) { map.Overlays.remove(ex); markersRef.current.delete(v.post.id) }
      const marker = new window.longdo.Marker(
        { lat: v.pos.lat, lon: v.pos.lon },
        { icon: { html: buildBusHtml(v), offset: { x: 40, y: 35 } } }
      )
      // Bind click
      window.longdo.Event.bind(marker, 'click', () => {
        setSelectedId(id => id === v.post.id ? null : v.post.id)
      })
      map.Overlays.add(marker)
      markersRef.current.set(v.post.id, marker)
    })

    // Remove markers for vehicles no longer in filtered list
    markersRef.current.forEach((_, postId) => {
      if (!filtered.find(v => v.post.id === postId)) {
        const m = markersRef.current.get(postId)
        if (m) { map.Overlays.remove(m); markersRef.current.delete(postId) }
      }
    })
  }, [filtered, tick, showLabels]) // eslint-disable-line

  // Follow selected vehicle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !followSelected || !selected) return
    map.location({ lat: selected.pos.lat, lon: selected.pos.lon }, true)
  }, [selected, tick, followSelected])

  // Center on selected when first clicked
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selected) return
    map.location({ lat: selected.pos.lat, lon: selected.pos.lon }, true)
  }, [selectedId]) // eslint-disable-line

  const activeRoutes = routes.filter(r => r.is_status === 'active')

  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
            <Navigation size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t('tracking', 'title')}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{t('tracking', 'subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-sm font-mono font-bold tracking-widest">{clock}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl px-3 py-2">
            <Signal size={13} className="animate-pulse" />
            <span className="text-xs font-bold">{filtered.length} {t('tracking', 'running')}</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        {[
          { icon:<Bus size={13} className="text-sky-400"/>,     label:t('tracking','todayTrips'), value:activePosts.length,                                       cls:'text-sky-700' },
          { icon:<Users size={13} className="text-indigo-400"/>, label:t('tracking','totalPassengers'),  value:vehicles.reduce((a,v)=>a+v.pax,0),                         cls:'text-indigo-700' },
          { icon:<Gauge size={13} className="text-emerald-400"/>,label:t('tracking','avgSpeed'), value:`${Math.round(vehicles.reduce((a,v)=>a+v.pos.speed,0)/(vehicles.length||1))} km/h`, cls:'text-emerald-700' },
          { icon:<Activity size={13} className="text-violet-400"/>,label:t('tracking','running'),   value:filtered.filter(v=>v.pos.progress>0&&v.pos.progress<1).length, cls:'text-violet-700' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
            {s.icon}
            <span className={`text-sm font-bold ${s.cls}`}>{s.value}</span>
            <span className="text-[10px] text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left: map */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Map toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Route filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              <button onClick={() => setFilterRoute('all')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filterRoute==='all'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50')}>
                {t('common', 'all')}
              </button>
              {activeRoutes.map(r => (
                <button key={r.id} onClick={() => setFilterRoute(r.id)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap', filterRoute===r.id?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50')}>
                  {r.code}
                </button>
              ))}
            </div>

            {/* Label toggle */}
            <button onClick={() => setShowLabels(v=>!v)}
              className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all', showLabels?'bg-sky-50 border-sky-200 text-sky-700':'bg-white border-slate-200 text-slate-500')}>
              {showLabels ? <Eye size={12}/> : <EyeOff size={12}/>}
              {t('tracking', 'labels')}
            </button>

            {/* Follow toggle */}
            {selectedId && (
              <button onClick={() => setFollow(v=>!v)}
                className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all', followSelected?'bg-violet-50 border-violet-200 text-violet-700':'bg-white border-slate-200 text-slate-500')}>
                <LocateFixed size={12}/>
                {followSelected ? t('tracking', 'tracking') : t('tracking', 'trackVehicle')}
              </button>
            )}

            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400">
              <RefreshCw size={11} className="animate-spin text-emerald-500" style={{ animationDuration:'3s' }}/>
              {t('tracking', 'updated')} {tick > 0 ? t('tracking', 'latest') : '-'}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ minHeight:480 }}>
            <div ref={mapElRef} className="w-full h-full" />
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Layers size={10}/>{t('tracking', 'routeLine')}</span>
            {vehicles.map(v => (
              <div key={v.post.id} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:v.color }} />
                <span className="text-[10px] text-slate-600">{v.post.route?.code ?? v.post.code}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-3 border-l border-slate-200 pl-3">
              {[{ c:'#10b981', l:'<60%' },{ c:'#f59e0b', l:'60-90%' },{ c:'#ef4444', l:'>90%' }].map(o => (
                <div key={o.l} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background:o.c }}/>
                  <span className="text-[10px] text-slate-500">{t('tracking', 'passengers')} {o.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: vehicle list + detail */}
        <div className="w-[320px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight:'calc(100vh - 200px)' }}>

          {/* Selected detail card */}
          {selected && (
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm" style={{ background:selected.color }}>
                  <Bus size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{selected.dv?.vehicle?.license ?? selected.post.code}</p>
                  <p className="text-[10px] text-slate-500 truncate">{selected.post.route?.name_th}</p>
                </div>
                <button onClick={() => { setSelectedId(null); setFollow(false) }} className="text-slate-400 hover:text-slate-600 text-lg leading-none flex-shrink-0">✕</button>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-slate-500">{t('tracking', 'progress')}</span>
                  <span className="font-bold text-sky-700">{Math.round(selected.pos.progress * 100)}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-sky-200">
                  <div className="h-full rounded-full transition-all" style={{ width:`${selected.pos.progress*100}%`, background:selected.color }} />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:t('tracking','speed'),    value:`${Math.round(selected.pos.speed)} km/h`,   icon:<Gauge size={11}/> },
                  { label:t('tracking','passengers'),  value:`${selected.pax}/${selected.cap}`,        icon:<Users size={11}/> },
                  { label:t('common','shift'),      value:selected.post.shift?.default_time ?? '-',     icon:<Clock size={11}/> },
                  { label:t('common','driver'),      value:selected.dv?.driver?.first_name_th ?? '-',    icon:<UserCheck size={11}/> },
                ].map(s => (
                  <div key={s.label} className="bg-white/80 rounded-xl px-3 py-2 border border-sky-100">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mb-0.5">{s.icon}{s.label}</div>
                    <p className="text-xs font-bold text-slate-700">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* GPS coordinates */}
              <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2">
                <MapPin size={11} className="text-emerald-400 flex-shrink-0"/>
                <span className="text-[10px] font-mono text-slate-300">
                  {selected.pos.lat.toFixed(5)}, {selected.pos.lon.toFixed(5)}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto flex-shrink-0"/>
              </div>

              {/* Follow toggle inside card */}
              <button onClick={() => setFollow(v=>!v)}
                className={cn('w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-xl border transition-all',
                  followSelected?'bg-violet-100 border-violet-300 text-violet-700':'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600')}>
                <LocateFixed size={13}/>
                {followSelected ? t('tracking', 'trackingActive') : t('tracking', 'trackOnMap')}
              </button>
            </div>
          )}

          {/* Vehicle list */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><Radio size={12} className="text-emerald-500"/>{t('tracking', 'runningVehicles')} ({filtered.length})</h3>
              <select className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none text-slate-500 focus:border-sky-400"
                value={filterRoute} onChange={e => setFilterRoute(e.target.value)}>
                <option value="all">{t('tracking', 'allLines')}</option>
                {activeRoutes.map(r => <option key={r.id} value={r.id}>{r.name_th}</option>)}
              </select>
            </div>
            <div className="divide-y divide-slate-50">
              {filtered.map(v => {
                const occ = v.cap > 0 ? Math.round((v.pax/v.cap)*100) : 0
                const occColor = occ>90?'text-red-600 bg-red-50':occ>60?'text-amber-600 bg-amber-50':'text-emerald-600 bg-emerald-50'
                return (
                  <div key={v.post.id}
                    onClick={() => setSelectedId(id => id===v.post.id ? null : v.post.id)}
                    className={cn('px-4 py-3 cursor-pointer transition-all hover:bg-slate-50 flex items-center gap-3', v.isSelected&&'bg-sky-50/50')}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm" style={{ background:v.color }}>
                      <Bus size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-slate-700 font-mono truncate">{v.dv?.vehicle?.license ?? v.post.code}</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"/>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{v.post.route?.name_th} · {v.dv?.driver?.first_name_th}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width:`${v.pos.progress*100}%`, background:v.color }}/>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">{Math.round(v.pos.progress*100)}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', occColor)}>{v.pax}/{v.cap}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{Math.round(v.pos.speed)} km/h</span>
                    </div>
                    {v.isSelected && <ChevronRight size={12} className="text-sky-400 flex-shrink-0"/>}
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 text-slate-300">
                  <Bus size={20} className="mb-1.5"/>
                  <p className="text-xs">{t('tracking', 'noVehiclesInLine')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Route overview */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><MapPin size={12} className="text-rose-500"/>{t('tracking', 'routePath')} ({activeRoutes.length})</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {activeRoutes.map((route, i) => {
                const routeVehicles = vehicles.filter(v => v.post.route_id === route.id)
                const totalPax = routeVehicles.reduce((a,v)=>a+v.pax,0)
                return (
                  <div key={route.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setFilterRoute(r => r===route.id ? 'all' : route.id)}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:ROUTE_COLORS[i%ROUTE_COLORS.length] }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{route.name_th}</p>
                      <p className="text-[10px] text-slate-400">{route.trip_direction === 'inbound' ? 'เที่ยวเข้า' : route.trip_direction === 'outbound' ? 'เที่ยวออก' : '-'} · {(route.points??[]).length} {t('common', 'point')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-700">{routeVehicles.length}</span>
                      <span className="text-[10px] text-slate-400">{totalPax} {t('tracking', 'passengers')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
