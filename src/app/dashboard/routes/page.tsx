'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, Edit, Trash2, ToggleRight, ToggleLeft, MapPin,
  ArrowRight, ArrowLeft, Navigation, Map as MapIcon, X, ChevronDown, ChevronUp,
  Search, LayoutGrid, List, ChevronUp as SortAsc, ChevronsUpDown,
  Maximize2, Minimize2, Layers,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { Route, Point } from '@/types'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import { useZoneStore } from '@/lib/stores/useZoneStore';

// ─── Longdo Map ───────────────────────────────────────────────
// Types declared in src/types/longdo.d.ts
const LONGDO_MAP_KEY = 'e516b73dc9f6e987181a591230bbe207'
type LMap = LongdoMap

const TRIP_IN  = 'inbound'
const TRIP_OUT = 'outbound'
const COLOR_IN  = '#3b82f6'  // blue
const COLOR_OUT = '#10b981'  // green

// ─── Route Map Panel ──────────────────────────────────────────
function RouteMapPanel({ route, pts, onClose }: { route: Route; pts: Point[]; onClose: () => void }) {
  const { t } = useLang()
  const { openModal } = useStore()
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef   = useRef<LMap | null>(null)
  const isIn     = route.trip_direction === TRIP_IN
  const color    = isIn ? COLOR_IN : COLOR_OUT

  const drawOverlays = useCallback((map: LMap) => {
    map.Overlays.clear()
    if (pts.length === 0) return

    const locs = pts.map(p => ({ lat: p.latitude, lon: p.longitude }))
    map.Overlays.add(new window.longdo.Polyline(locs, { lineColor: color, lineWidth: 4, lineStyle: 'solid' }))

    pts.forEach((p, idx) => {
      const isFirst = idx === 0
      const isLast  = idx === pts.length - 1
      const bg = isFirst ? color : isLast ? '#1e293b' : 'white'
      const fg = isFirst || isLast ? 'white' : color
      const border = isFirst || isLast ? bg : color
      map.Overlays.add(new window.longdo.Marker(
        { lat: p.latitude, lon: p.longitude },
        {
          icon: {
            html: `<div style="background:${bg};border:2px solid ${border};border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:${fg};box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;">${p.queue_default ?? idx + 1}</div>`,
            offset: { x: 14, y: 14 },
          },
          popup: {
            html: `<div style="padding:6px 10px;font-size:12px;font-weight:600;min-width:120px"><span style="color:${color}">${t('routes','stopList')} ${p.queue_default ?? idx + 1}</span><br/><span style="color:#1e293b">${p.name_th}</span><br/><span style="color:#94a3b8;font-size:10px;font-family:monospace">${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}</span></div>`,
            loadOnShow: true,
          },
        }
      ))
    })
  }, [pts, color, t])

  const initMap = useCallback(() => {
    if (!mapElRef.current || !window.longdo) return

    if (!mapRef.current) {
      mapRef.current = new window.longdo.Map({
        placeholder: mapElRef.current,
        zoom: 12,
        lastView: false,
        location: pts[0]
          ? { lat: pts[0].latitude, lon: pts[0].longitude }
          : { lat: 13.76, lon: 100.50 },
      })
      mapRef.current.Ui.Fullscreen.visible(false)
      mapRef.current.Ui.LayerSelector.visible(false)
    } else {
      if (pts[0]) mapRef.current.location({ lat: pts[0].latitude, lon: pts[0].longitude }, true)
    }

    drawOverlays(mapRef.current)
  }, [pts, drawOverlays])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.longdo) { initMap(); return }
    const existing = document.querySelector(`script[src*="longdo.com"]`)
    if (existing) { existing.addEventListener('load', initMap); return }
    const s = document.createElement('script')
    s.src = `https://api.longdo.com/map/?key=${LONGDO_MAP_KEY}`
    s.async = true; s.onload = initMap
    document.head.appendChild(s)
    return () => { s.onload = null }
  }, [initMap])

  const [collapsed, setCollapsed]   = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const toggleFullscreen = () => {
    const next = !fullscreen
    setFullscreen(next)
    setCollapsed(false)
    setTimeout(() => {
      mapRef.current?.resize()
      window.dispatchEvent(new Event('resize'))
    }, 50)
  }

  return (
    <div className={`flex flex-col bg-white border border-slate-200 shadow-lg overflow-hidden ${
      fullscreen
        ? 'fixed top-[60px] inset-x-0 bottom-0 z-[9999] rounded-none'
        : 'rounded-2xl h-full transition-all duration-300'
    }`}>
      {/* Panel header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-white">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: isIn ? '#eff6ff' : '#f0fdf4', border: `1px solid ${color}` }}
        >
          {isIn ? <ArrowRight size={14} style={{ color }} /> : <ArrowLeft size={14} style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{route.name_th}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-400">{route.code}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: isIn ? '#dbeafe' : '#dcfce7', color }}>
              {isIn ? t('routes', 'inboundLabel') : t('routes', 'outboundLabel')}
            </span>
            <span className="text-[10px] text-slate-400">{pts.length} {t('routes','stopList')}</span>
          </div>
        </div>
        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0"
          title={fullscreen ? 'ออกจาก Fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        {/* Collapse toggle (ซ่อนตอน fullscreen) */}
        {!fullscreen && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title={collapsed ? 'ขยาย' : 'ย่อ'}
          >
            <ChevronDown size={15} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
          title="ปิด"
        >
          <X size={15} />
        </button>
      </div>

      {/* Map + Stops */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${collapsed ? 'h-0 opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Map — fullscreen ให้สูงขึ้น */}
      <div className={`flex-shrink-0 ${fullscreen ? 'h-[calc(100vh-60px-56px-280px)]' : 'h-[340px]'}`} ref={mapElRef} />

      {/* Stops list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2.5 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {t('routes','stopsOrdered')} ({pts.length})
          </p>
          <div className="space-y-1">
            {pts.map((pt, idx) => {
              const isFirst = idx === 0
              const isLast  = idx === pts.length - 1
              return (
                <div key={pt.id} className="flex items-center gap-2 group">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 flex-shrink-0"
                      style={{
                        background: isFirst ? color : isLast ? '#1e293b' : 'white',
                        borderColor: isFirst ? color : isLast ? '#1e293b' : color,
                        color: isFirst || isLast ? 'white' : color,
                      }}
                    >
                      {pt.queue_default ?? idx + 1}
                    </div>
                    {idx < pts.length - 1 && (
                      <div className="w-px h-4 mt-0.5" style={{ background: color, opacity: 0.3 }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-700 truncate">{pt.name_th}</p>
                      {isFirst && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: isIn ? '#dbeafe' : '#dcfce7', color }}>
                          {t('routes','origin')}
                        </span>
                      )}
                      {isLast && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900 text-white flex-shrink-0">
                          {t('routes','destination')}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">
                      {pt.code} · {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => openModal('edit-point', pt)}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                      <Edit size={11} />
                    </button>
                    <button
                      onClick={() => openModal('delete-point', pt)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
            {pts.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">{t('routes','noStops')}</p>
            )}
          </div>
        </div>
      </div>
      </div> {/* end collapse wrapper */}
    </div>
  )
}

// ─── Route Card ───────────────────────────────────────────────
function RouteCard({
  route, pts, isSelected, onSelect, onEdit, onToggle, onDelete, onAddPoint,
}: {
  route: Route; pts: Point[]; isSelected: boolean
  onSelect: () => void; onEdit: () => void; onToggle: () => void
  onDelete: () => void; onAddPoint: () => void
}) {
  const { t } = useLang()
  const isIn  = route.trip_direction === TRIP_IN
  const color = isIn ? COLOR_IN : COLOR_OUT

  return (
    <div
      className={`rounded-xl cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'shadow-md' : 'hover:border-opacity-60'
      }`}
      style={{
        border: isSelected ? `2px solid ${color}` : '1px solid #e2e8f0',
        boxShadow: isSelected ? `0 0 0 3px ${color}33` : undefined,
      }}
      onClick={onSelect}
    >
      {/* Color top bar */}
      <div className="h-1 rounded-t-xl" style={{ background: route.is_status === 'active' ? color : '#e2e8f0' }} />
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: isIn ? '#dbeafe' : '#dcfce7', color }}
              >
                {isIn ? t('routes', 'inboundLabel') : t('routes', 'outboundLabel')}
              </span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                route.is_status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {getStatusLabel(route.is_status)}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 truncate">{route.name_th}</p>
            <p className="text-[10px] font-mono text-slate-400">{route.code}</p>
          </div>
          <MapPin size={13} className="flex-shrink-0 mt-1" style={{ color }} />
        </div>

        {/* Stops mini timeline */}
        <div className="flex items-center gap-1 mb-2.5">
          {pts.slice(0, 5).map((pt, idx) => (
            <div key={pt.id} className="flex items-center gap-1 min-w-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{
                  background: idx === 0 ? color : idx === pts.length - 1 && pts.length <= 5 ? '#1e293b' : 'white',
                  border: `1.5px solid ${idx === 0 ? color : idx === pts.length - 1 && pts.length <= 5 ? '#1e293b' : color}`,
                  color: idx === 0 || (idx === pts.length - 1 && pts.length <= 5) ? 'white' : color,
                }}
              >
                {pt.queue_default ?? idx + 1}
              </div>
              {idx < Math.min(pts.length - 1, 4) && (
                <div className="flex-1 h-px min-w-[6px]" style={{ background: color, opacity: 0.3 }} />
              )}
            </div>
          ))}
          {pts.length > 5 && (
            <span className="text-[9px] text-slate-400 ml-1">+{pts.length - 5}</span>
          )}
          {pts.length === 0 && (
            <span className="text-[10px] text-slate-400 italic">{t('routes','noStops')}</span>
          )}
        </div>

        {/* Counts */}
        <div className="flex items-center text-[10px] text-slate-400 mb-2.5">
          <MapPin size={10} className="mr-1" />
          <span>{pts.length} {t('routes','stopList')}</span>
          {pts[0] && (
            <span className="ml-2 truncate">{pts[0].name_th} → {pts[pts.length - 1]?.name_th}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
          <button
            onClick={e => { e.stopPropagation(); onSelect() }}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg transition-colors hover:bg-sky-50"
            style={{ color }}
          >
            <MapIcon size={10} /> {t('routes','viewMap')}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onAddPoint() }}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Plus size={10} /> {t('routes','addStop2')}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Edit size={11} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onToggle() }}
            className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {route.is_status === 'active' ? <ToggleRight size={11} className="text-emerald-500" /> : <ToggleLeft size={11} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function RoutesPage() {
  const { openModal } = useStore()
  const { routes, points, toggleRouteStatus, loadRoutesPoints } = useRoutePointStore()
  const { zones, loadZones } = useZoneStore()
  const { t } = useLang()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [zoneId, setZoneId]         = useState<string | null>(null)
  const [view, setView]             = useState<'card' | 'table'>('card')
  const [sortKey, setSortKey]       = useState<'code' | 'name_th' | 'trip_direction' | 'stops' | 'is_status'>('code')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadRoutesPoints()
    loadZones()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const routePoints = (routeId: string) =>
    points
      .filter(p => p.route_id === routeId && p.is_status === 'active')
      .sort((a, b) => (a.queue_default ?? 999) - (b.queue_default ?? 999))

  // routes that belong to the selected zone
  const zoneRouteIds = zoneId
    ? new Set(zones.find(z => z.id === zoneId)?.routes?.map(r => r.id) ?? [])
    : null

  const q = search.trim().toLowerCase()
  const matchRoute = (r: typeof routes[0]) =>
    (zoneRouteIds ? zoneRouteIds.has(r.id) : true) &&
    (!q ||
      r.code.toLowerCase().includes(q) ||
      r.name_th.toLowerCase().includes(q) ||
      (r.name_en ?? '').toLowerCase().includes(q))

  const inbound  = routes.filter(r => r.trip_direction === TRIP_IN)
  const outbound = routes.filter(r => r.trip_direction === TRIP_OUT)
  const inboundFiltered  = inbound.filter(matchRoute)
  const outboundFiltered = outbound.filter(matchRoute)

  const allFiltered = routes.filter(matchRoute).slice().sort((a, b) => {
    let va: string | number = ''
    let vb: string | number = ''
    if (sortKey === 'stops') {
      va = routePoints(a.id).length
      vb = routePoints(b.id).length
    } else {
      va = (a[sortKey] ?? '').toString().toLowerCase()
      vb = (b[sortKey] ?? '').toString().toLowerCase()
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const selectedRoute = routes.find(r => r.id === selectedId) ?? null
  const selectedPts   = selectedRoute ? routePoints(selectedRoute.id) : []

  return (
    <div className="flex gap-5 animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>

      {/* ── Left: route list ─────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pb-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t('routes', 'title')}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {inbound.length} {t('routes', 'inbound')} · {outbound.length} {t('routes', 'outbound')} · {points.filter(p => p.is_status === 'active').length} {t('routes', 'activeStops')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<MapPin size={13} />} onClick={() => openModal('add-point')}>
              {t('routes', 'addStop')}
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-route')}>
              {t('routes', 'addRoute')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: t('routes','totalRoutes'), value: routes.length,                                      color: 'bg-slate-50 border-slate-200',    text: 'text-slate-700' },
            { label: t('routes','inbound'),      value: inbound.length,                                     color: 'bg-blue-50 border-blue-100',      text: 'text-blue-700'  },
            { label: t('routes','outbound'),       value: outbound.length,                                    color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
            { label: t('routes','activeStops'),   value: points.filter(p => p.is_status === 'active').length, color: 'bg-sky-50 border-sky-100',        text: 'text-sky-700'   },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Zone filter pills */}
        {zones.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
              <Layers size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-wide">โซน</span>
            </div>
            <button
              onClick={() => { setZoneId(null); setSelectedId(null) }}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                zoneId === null
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-500'
              }`}
            >
              ทั้งหมด
            </button>
            {zones.map(z => (
              <button
                key={z.id}
                onClick={() => { setZoneId(z.id); setSelectedId(null) }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  zoneId === z.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-500'
                }`}
              >
                {z.name_th}
                {zoneId === z.id && (
                  <span className="ml-1.5 opacity-80">
                    ({(z.routes?.length ?? 0)})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Search + View Toggle */}
        <div className="flex gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={zoneId ? `ค้นหาใน ${zones.find(z => z.id === zoneId)?.name_th}...` : 'ค้นหาด้วยรหัส หรือชื่อสาย...'}
              className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden flex-shrink-0">
            <button
              onClick={() => setView('card')}
              className={`px-3 py-2 transition-colors ${view === 'card' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              title="Card view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 transition-colors ${view === 'table' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              title="Table view"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* ── Table View ────────────────────────────────────── */}
        {view === 'table' && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex-shrink-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {([
                    { key: 'code',           label: 'รหัส'      },
                    { key: 'trip_direction', label: 'ทิศทาง'    },
                    { key: 'name_th',        label: 'ชื่อ (TH)' },
                    { key: 'name_en',        label: 'ชื่อ (EN)' },
                    { key: 'stops',          label: 'จุดจอด'    },
                    { key: 'is_status',      label: 'สถานะ'     },
                  ] as { key: typeof sortKey; label: string }[]).map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="px-3 py-2.5 text-left font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-700 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key
                          ? <ChevronUp size={11} className={`transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                          : <ChevronsUpDown size={11} className="opacity-30" />
                        }
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map((route, idx) => {
                  const isIn  = route.trip_direction === TRIP_IN
                  const color = isIn ? COLOR_IN : COLOR_OUT
                  const pts   = routePoints(route.id)
                  const isSelected = selectedId === route.id
                  return (
                    <tr
                      key={route.id}
                      onClick={() => setSelectedId(selectedId === route.id ? null : route.id)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors last:border-0 ${
                        isSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{route.code}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: isIn ? '#dbeafe' : '#dcfce7', color }}>
                          {isIn ? <ArrowRight size={9} /> : <ArrowLeft size={9} />}
                          {isIn ? 'Inbound' : 'Outbound'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-700 max-w-[160px] truncate">{route.name_th}</td>
                      <td className="px-3 py-2.5 text-slate-500 max-w-[140px] truncate">{route.name_en || '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color }}>
                          <MapPin size={10} />{pts.length}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          route.is_status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {route.is_status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedId(selectedId === route.id ? null : route.id)}
                            className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors" title="ดูแผนที่">
                            <MapIcon size={12} />
                          </button>
                          <button onClick={() => openModal('add-point', { routeId: route.id, direction: route.trip_direction })}
                            className="p-1 rounded text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-colors" title="เพิ่มจุดจอด">
                            <Plus size={12} />
                          </button>
                          <button onClick={() => openModal('edit-route', route)}
                            className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="แก้ไข">
                            <Edit size={12} />
                          </button>
                          <button onClick={() => toggleRouteStatus(route.id)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors" title="เปลี่ยนสถานะ">
                            {route.is_status === 'active' ? <ToggleRight size={12} className="text-emerald-500" /> : <ToggleLeft size={12} />}
                          </button>
                          <button onClick={() => openModal('delete-route', route)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="ลบ">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {allFiltered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                      {q ? `ไม่พบสาย "${search}"` : 'ยังไม่มีข้อมูลเส้นทาง'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Two-column: Inbound | Outbound ─────────────────── */}
        {view === 'card' && <div className="grid grid-cols-2 gap-4">

          {/* เที่ยวเข้า */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 sticky top-0 bg-white/90 backdrop-blur-sm py-1 z-10">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: COLOR_IN }} />
                <span className="text-sm font-bold text-slate-800">{t('routes', 'inboundLabel')}</span>
              </div>
              <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                {q ? `${inboundFiltered.length}/` : ''}{inbound.length} {t('routes','line')}
              </span>
            </div>
            {inboundFiltered.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                pts={routePoints(route.id)}
                isSelected={selectedId === route.id}
                onSelect={() => setSelectedId(selectedId === route.id ? null : route.id)}
                onEdit={() => openModal('edit-route', route)}
                onToggle={() => toggleRouteStatus(route.id)}
                onDelete={() => openModal('delete-route', route)}
                onAddPoint={() => openModal('add-point', { routeId: route.id, direction: route.trip_direction })}
              />
            ))}
            {inboundFiltered.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-blue-200 p-6 text-center">
                {q
                  ? <p className="text-xs text-slate-400">ไม่พบสาย &quot;{search}&quot; ในเที่ยวเข้า</p>
                  : <>
                      <p className="text-xs text-slate-400">{t('routes', 'noInbound')}</p>
                      <button onClick={() => openModal('add-route', 'inbound')} className="text-xs text-blue-500 hover:underline mt-1">{t('routes', 'addNewRoute')}</button>
                    </>
                }
              </div>
            )}
          </div>

          {/* เที่ยวออก */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 sticky top-0 bg-white/90 backdrop-blur-sm py-1 z-10">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: COLOR_OUT }} />
                <span className="text-sm font-bold text-slate-800">{t('routes', 'outboundLabel')}</span>
              </div>
              <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                {q ? `${outboundFiltered.length}/` : ''}{outbound.length} {t('routes','line')}
              </span>
            </div>
            {outboundFiltered.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                pts={routePoints(route.id)}
                isSelected={selectedId === route.id}
                onSelect={() => setSelectedId(selectedId === route.id ? null : route.id)}
                onEdit={() => openModal('edit-route', route)}
                onToggle={() => toggleRouteStatus(route.id)}
                onDelete={() => openModal('delete-route', route)}
                onAddPoint={() => openModal('add-point', { routeId: route.id, direction: route.trip_direction })}
              />
            ))}
            {outboundFiltered.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-emerald-200 p-6 text-center">
                {q
                  ? <p className="text-xs text-slate-400">ไม่พบสาย &quot;{search}&quot; ในเที่ยวออก</p>
                  : <>
                      <p className="text-xs text-slate-400">{t('routes', 'noOutbound')}</p>
                      <button onClick={() => openModal('add-route', 'outbound')} className="text-xs text-emerald-500 hover:underline mt-1">{t('routes', 'addNewRoute')}</button>
                    </>
                }
              </div>
            )}
          </div>
        </div>}
      </div>

      {/* ── Right: map + stops detail panel ─────────────────── */}
      {selectedRoute ? (
        <div className="w-[400px] flex-shrink-0 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
          <RouteMapPanel
            route={selectedRoute}
            pts={selectedPts}
            onClose={() => setSelectedId(null)}
          />
        </div>
      ) : (
        <div className="w-[400px] flex-shrink-0 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 sticky top-0 self-start" style={{ height: 500 }}>
          <MapIcon size={32} className="mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">{t('routes', 'selectRoute')}</p>
          <p className="text-xs mt-1">{t('routes', 'clickRoute')}</p>
        </div>
      )}
    </div>
  )
}
