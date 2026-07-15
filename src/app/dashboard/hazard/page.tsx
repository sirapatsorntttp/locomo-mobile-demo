'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  AlertTriangle, Flame, Droplets, Construction, ShieldAlert,
  CloudRain, MapPin, Clock, RefreshCw, Filter,
  ChevronRight, Eye, CheckCircle2, XCircle, Radio,
  Layers, Satellite, Map as MapIcon, Maximize2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'

const LONGDO_MAP_KEY = 'e516b73dc9f6e987181a591230bbe207'

// ── Types ─────────────────────────────────────────────────────────────────────
type HazardType     = 'accident' | 'flood' | 'road_damage' | 'construction' | 'risk_zone' | 'weather'
type HazardSeverity = 'critical' | 'high' | 'medium' | 'low'
type HazardStatus   = 'active' | 'monitoring' | 'cleared'

interface Hazard {
  id: string
  type: HazardType
  severity: HazardSeverity
  status: HazardStatus
  title: string
  detail: string
  location: string
  route: string
  lat: number
  lon: number
  reported_at: string
  updated_at: string
  reported_by: string
  affected_vehicles: number
}

// ── Config maps ───────────────────────────────────────────────────────────────
const TYPE_CFG: Record<HazardType, {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string
  mapColor: string; mapIcon: string
}> = {
  accident:     { label:'อุบัติเหตุ',   icon:<Flame size={11}/>,        color:'text-red-700',     bg:'bg-red-50',     border:'border-red-200',     mapColor:'#dc2626', mapIcon:'⚠️' },
  flood:        { label:'น้ำท่วม',      icon:<Droplets size={11}/>,     color:'text-blue-700',    bg:'bg-blue-50',    border:'border-blue-200',    mapColor:'#2563eb', mapIcon:'💧' },
  road_damage:  { label:'ถนนชำรุด',    icon:<ShieldAlert size={11}/>,  color:'text-orange-700',  bg:'bg-orange-50',  border:'border-orange-200',  mapColor:'#ea580c', mapIcon:'🚧' },
  construction: { label:'ก่อสร้าง',    icon:<Construction size={11}/>, color:'text-yellow-700',  bg:'bg-yellow-50',  border:'border-yellow-200',  mapColor:'#ca8a04', mapIcon:'🏗️' },
  risk_zone:    { label:'จุดเสี่ยง',   icon:<AlertTriangle size={11}/>,color:'text-rose-700',    bg:'bg-rose-50',    border:'border-rose-200',    mapColor:'#e11d48', mapIcon:'🔴' },
  weather:      { label:'สภาพอากาศ',   icon:<CloudRain size={11}/>,    color:'text-sky-700',     bg:'bg-sky-50',     border:'border-sky-200',     mapColor:'#0284c7', mapIcon:'🌧️' },
}

const SEV_CFG: Record<HazardSeverity, {
  label: string; color: string; bg: string; border: string; ring: string; dot: string
}> = {
  critical: { label:'วิกฤต',    color:'text-red-800',    bg:'bg-red-100',    border:'border-red-400',    ring:'ring-red-300',    dot:'#dc2626' },
  high:     { label:'สูง',      color:'text-orange-700', bg:'bg-orange-100', border:'border-orange-400', ring:'ring-orange-300', dot:'#ea580c' },
  medium:   { label:'กลาง',    color:'text-amber-700',  bg:'bg-amber-100',  border:'border-amber-400',  ring:'ring-amber-300',  dot:'#d97706' },
  low:      { label:'ต่ำ',      color:'text-sky-700',    bg:'bg-sky-100',    border:'border-sky-300',    ring:'ring-sky-200',    dot:'#0284c7' },
}

const ST_CFG: Record<HazardStatus, { label: string; color: string; bg: string; border: string }> = {
  active:     { label:'กำลังเกิด',   color:'text-red-700',     bg:'bg-red-50',     border:'border-red-200'     },
  monitoring: { label:'เฝ้าระวัง',  color:'text-amber-700',   bg:'bg-amber-50',   border:'border-amber-200'   },
  cleared:    { label:'คลี่คลายแล้ว', color:'text-emerald-700', bg:'bg-emerald-50', border:'border-emerald-200' },
}

// ── Mock hazard data (real-ish Thai road locations) ───────────────────────────
const MOCK_HAZARDS: Hazard[] = [
  {
    id:'hz-01', type:'accident', severity:'critical', status:'active',
    title:'อุบัติเหตุรถชนกัน 3 คัน', detail:'รถบรรทุกชนรถยนต์ 2 คันบนทางหลวง ถนนปิดบางส่วน ควรหลีกเลี่ยงเส้นทางนี้ชั่วคราว ตำรวจและหน่วยกู้ชีพอยู่ในพื้นที่',
    location:'ถนนพหลโยธิน กม.42', route:'สายรังสิต', lat:14.02, lon:100.61,
    reported_at:'09:14', updated_at:'09:45', reported_by:'คนขับ DRV-012', affected_vehicles:4,
  },
  {
    id:'hz-02', type:'flood', severity:'high', status:'active',
    title:'น้ำท่วมขังบนถนน', detail:'น้ำท่วมสูงประมาณ 30 ซม. หลังฝนตกหนักตอนเช้า รถเล็กควรระวัง รถตู้ยังสามารถผ่านได้',
    location:'ถนนรังสิต-นครนายก กม.15', route:'สายนครนายก', lat:13.98, lon:100.82,
    reported_at:'07:30', updated_at:'09:00', reported_by:'ศูนย์ควบคุม', affected_vehicles:2,
  },
  {
    id:'hz-03', type:'construction', severity:'medium', status:'active',
    title:'ก่อสร้างรถไฟฟ้า ปิดช่องจราจร', detail:'โครงการรถไฟฟ้าสายสีแดง ปิด 1 ช่องทางจราจร เวลาออกเดินทางควรเพิ่มขึ้น 10-15 นาที',
    location:'ถนนวิภาวดีรังสิต', route:'สายรังสิต / อ่างทอง', lat:13.88, lon:100.57,
    reported_at:'06:00', updated_at:'08:00', reported_by:'แผนกวางแผน', affected_vehicles:8,
  },
  {
    id:'hz-04', type:'road_damage', severity:'medium', status:'monitoring',
    title:'ถนนทรุดตัว หลุมบ่อขนาดใหญ่', detail:'ถนนทรุดตัวจากการรั่วซึมของท่อน้ำใต้ดิน หลุมบ่อกว้าง 2 เมตร วางกรวยแล้ว แต่ยังไม่ซ่อม',
    location:'ถนนสุขุมวิท ซ.71', route:'สายบ้านหมอ', lat:13.72, lon:100.60,
    reported_at:'เมื่อวาน', updated_at:'08:30', reported_by:'คนขับ DRV-007', affected_vehicles:1,
  },
  {
    id:'hz-05', type:'risk_zone', severity:'high', status:'active',
    title:'จุดเสี่ยงทัศนวิสัยไม่ดี ช่วงหัวรุ่ง', detail:'โค้งอันตรายบนทางหลวง 1 ทัศนวิสัยต่ำในเวลาเช้า มีหมอกลงหนา โปรดขับรถช้าลงและเปิดไฟหน้า',
    location:'ทางหลวง 1 กม.60', route:'สายอ่างทอง', lat:14.35, lon:100.45,
    reported_at:'05:45', updated_at:'07:00', reported_by:'แผนกความปลอดภัย', affected_vehicles:3,
  },
  {
    id:'hz-06', type:'weather', severity:'medium', status:'active',
    title:'ฝนตกหนัก ถนนลื่น', detail:'พยากรณ์อากาศแจ้งฝนหนักบริเวณนี้ช่วง 10:00-14:00 น. แนะนำเพิ่มระยะห่าง และลดความเร็ว',
    location:'ทางหลวง 32 (อยุธยา-อ่างทอง)', route:'สายอ่างทอง', lat:14.48, lon:100.50,
    reported_at:'08:00', updated_at:'08:00', reported_by:'กรมอุตุนิยมวิทยา', affected_vehicles:5,
  },
  {
    id:'hz-07', type:'accident', severity:'low', status:'cleared',
    title:'รถเสียขวางถนน — คลี่คลายแล้ว', detail:'รถยนต์เสียยางแบนขวางไหล่ทาง ได้รับการช่วยเหลือและเปิดช่องทางปกติแล้ว',
    location:'ถนนพระราม 2 กม.28', route:'มวกเหล็ก', lat:13.64, lon:100.44,
    reported_at:'07:00', updated_at:'08:20', reported_by:'คนขับ DRV-003', affected_vehicles:0,
  },
  {
    id:'hz-08', type:'construction', severity:'low', status:'monitoring',
    title:'ซ่อมสะพานปิดครึ่งสะพาน', detail:'ซ่อมแซมสะพานข้ามคลอง ปิดครึ่งหนึ่ง ผลัดกันสัญจรทางเดียว ล่าช้าประมาณ 5 นาที',
    location:'สะพานปากน้ำโพ', route:'สายพระบาท', lat:14.12, lon:100.70,
    reported_at:'06:30', updated_at:'09:00', reported_by:'แผนกวางแผน', affected_vehicles:2,
  },
  {
    id:'hz-09', type:'flood', severity:'low', status:'monitoring',
    title:'น้ำเริ่มท่วมบริเวณทุ่งนา', detail:'น้ำท่วมบริเวณทุ่งนาข้างถนน ยังไม่ถึงถนน แต่เฝ้าระวังหากฝนตกเพิ่ม',
    location:'ทางหลวง 305 กม.22', route:'สายนครนายก', lat:14.10, lon:100.92,
    reported_at:'08:45', updated_at:'09:10', reported_by:'ศูนย์ควบคุม', affected_vehicles:0,
  },
  {
    id:'hz-10', type:'risk_zone', severity:'critical', status:'active',
    title:'สะพานน้ำหนักเกิน — ห้ามรถบรรทุก', detail:'สะพานชำรุด ห้ามรถน้ำหนักเกิน 5 ตัน รถตู้และมินิบัสยังผ่านได้ รอการซ่อมแซมเร่งด่วน',
    location:'สะพานแม่น้ำป่าสัก', route:'สายอ่างทอง', lat:14.56, lon:100.60,
    reported_at:'08:00', updated_at:'09:30', reported_by:'กรมทางหลวง', affected_vehicles:6,
  },
]

type FilterType     = 'all' | HazardType
type FilterSeverity = 'all' | HazardSeverity
type FilterStatus   = 'all' | HazardStatus
type MapLayer       = 'normal' | 'traffic' | 'satellite'

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HazardPage() {
  const { t, lang } = useLang()
  const timeLocale = lang === 'en' ? 'en-US' : 'th-TH'
  const [hazards, setHazards]           = useState<Hazard[]>(MOCK_HAZARDS)
  const [selected, setSelected]         = useState<Hazard | null>(null)
  const [filterType, setFilterType]     = useState<FilterType>('all')
  const [filterSev, setFilterSev]       = useState<FilterSeverity>('all')
  const [filterSt, setFilterSt]         = useState<FilterStatus>('all')
  const [mapLayer, setMapLayer]         = useState<MapLayer>('normal')
  const [lastRefresh, setLastRefresh]   = useState(() => new Date().toLocaleTimeString(timeLocale, { hour:'2-digit', minute:'2-digit' }))

  const mapElRef   = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<LongdoMap | null>(null)
  const markersRef = useRef<Map<string, LongdoMarker>>(new Map())

  // ── i18n label maps ────────────────────────────────────────────
  const typeLabel: Record<HazardType, string> = {
    accident: t('hazard','typeAccident'), flood: t('hazard','typeFlood'),
    road_damage: t('hazard','typeRoad'), construction: t('hazard','typeConstruction'),
    risk_zone: t('hazard','typeRisk'), weather: t('hazard','typeWeather'),
  }
  const sevLabel: Record<HazardSeverity, string> = {
    critical: t('hazard','sevCritical'), high: t('hazard','sevHigh'),
    medium: t('hazard','sevMedium'), low: t('hazard','sevLow'),
  }
  const stLabel: Record<HazardStatus, string> = {
    active: t('hazard','statusActive'), monitoring: t('hazard','statusWatch'),
    cleared: t('hazard','statusResolved'),
  }

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = hazards
    if (filterType !== 'all') list = list.filter(h => h.type === filterType)
    if (filterSev  !== 'all') list = list.filter(h => h.severity === filterSev)
    if (filterSt   !== 'all') list = list.filter(h => h.status === filterSt)
    return list.sort((a, b) => {
      const sevOrder = { critical:0, high:1, medium:2, low:3 }
      return sevOrder[a.severity] - sevOrder[b.severity]
    })
  }, [hazards, filterType, filterSev, filterSt])

  // ── KPIs ───────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    critical:   hazards.filter(h => h.severity === 'critical' && h.status !== 'cleared').length,
    active:     hazards.filter(h => h.status === 'active').length,
    monitoring: hazards.filter(h => h.status === 'monitoring').length,
    cleared:    hazards.filter(h => h.status === 'cleared').length,
  }), [hazards])

  // ── Map builder ────────────────────────────────────────────────
  function markerHtml(h: Hazard, isSelected: boolean) {
    const tc   = TYPE_CFG[h.type]
    const sc   = SEV_CFG[h.severity]
    const ring = isSelected ? `box-shadow:0 0 0 3px white,0 0 0 5px ${sc.dot};` : ''
    const pulse = h.severity === 'critical' && h.status === 'active'
      ? `animation:none;` : ''
    return `<div style="
      background:${tc.mapColor};color:white;
      padding:4px 9px;border-radius:20px;
      font-size:10px;font-weight:700;font-family:sans-serif;
      border:2px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      cursor:pointer;white-space:nowrap;
      display:flex;align-items:center;gap:4px;
      opacity:${h.status === 'cleared' ? 0.5 : 1};
      ${ring}${pulse}
    ">
      ${tc.mapIcon} ${h.location.slice(0, 18)}
      ${h.severity === 'critical' ? '<span style="background:rgba(255,255,255,0.25);border-radius:4px;padding:0 3px;font-size:8px;margin-left:2px">!</span>' : ''}
    </div>`
  }

  const initMap = useCallback(() => {
    if (!mapElRef.current || !window.longdo || mapRef.current) return
    const map = new window.longdo.Map({
      placeholder: mapElRef.current, zoom: 9, lastView: false,
      location: { lat: 14.0, lon: 100.55 },
    })
    mapRef.current = map
  }, [])

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

  // Place / refresh markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.longdo) return
    // Remove all old markers
    markersRef.current.forEach(m => map.Overlays.remove(m))
    markersRef.current.clear()
    // Add fresh markers
    hazards.forEach(h => {
      const isSelected = selected?.id === h.id
      const marker = new window.longdo.Marker(
        { lat: h.lat, lon: h.lon },
        { icon: { html: markerHtml(h, isSelected), offset: { x: 60, y: 18 } } }
      )
      window.longdo.Event.bind(marker, 'click', () => setSelected(h))
      map.Overlays.add(marker)
      markersRef.current.set(h.id, marker)
    })
  }, [hazards, selected]) // eslint-disable-line

  // Layer switcher
  const applyLayer = useCallback((layer: MapLayer) => {
    const map = mapRef.current
    if (!map || !window.longdo) return
    setMapLayer(layer)
    try {
      if (layer === 'satellite') {
        map.Layers.setBase(window.longdo.Layers.SATELLITE)
        map.Layers.remove(window.longdo.Layers.TRAFFIC)
      } else if (layer === 'traffic') {
        map.Layers.setBase(window.longdo.Layers.NORMAL)
        map.Layers.add(window.longdo.Layers.TRAFFIC)
      } else {
        map.Layers.setBase(window.longdo.Layers.NORMAL)
        map.Layers.remove(window.longdo.Layers.TRAFFIC)
      }
    } catch { /* ignore */ }
  }, [])

  // Fly to selected
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.longdo || !selected) return
    map.location({ lat: selected.lat, lon: selected.lon }, true)
    map.zoom(13, true)
  }, [selected])

  const markCleared = (id: string) =>
    setHazards(prev => prev.map(h => h.id === id ? { ...h, status: 'cleared' } : h))

  const refresh = () => {
    setLastRefresh(new Date().toLocaleTimeString(timeLocale, { hour:'2-digit', minute:'2-digit' }))
  }

  return (
    <div className="flex flex-col h-full gap-3 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-200">
            <AlertTriangle size={18} className="text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hazard Map</h1>
            <p className="text-xs text-slate-400">{t('hazard','subtitle')}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex items-center gap-2">
          {[
            { label:t('hazard','sevCritical'),    value:kpis.critical,   bg:'bg-red-50',     border:'border-red-200',     text:'text-red-700',     dot:'bg-red-500'     },
            { label:t('hazard','statusActive'),   value:kpis.active,     bg:'bg-rose-50',    border:'border-rose-200',    text:'text-rose-700',    dot:'bg-rose-500'    },
            { label:t('hazard','statusWatch'),    value:kpis.monitoring, bg:'bg-amber-50',   border:'border-amber-200',   text:'text-amber-700',   dot:'bg-amber-500'   },
            { label:t('hazard','statusResolved'), value:kpis.cleared,    bg:'bg-emerald-50', border:'border-emerald-200', text:'text-emerald-700', dot:'bg-emerald-500' },
          ].map(k => (
            <div key={k.label} className={cn('flex items-center gap-1.5 border rounded-xl px-3 py-2', k.bg, k.border)}>
              <div className={cn('w-2 h-2 rounded-full', k.dot)}/>
              <span className={cn('text-sm font-bold', k.text)}>{k.value}</span>
              <span className={cn('text-[10px]', k.text, 'opacity-70')}>{k.label}</span>
            </div>
          ))}

          <button onClick={refresh}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors">
            <RefreshCw size={12}/> {lastRefresh}
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* ── LEFT: filters + hazard list ─────────────────────────── */}
        <div className="w-[310px] flex-shrink-0 flex flex-col gap-2 min-h-0">

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Filter size={11} className="text-slate-400"/>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('hazard','filtersLabel')}</span>
            </div>

            {/* Status */}
            <div className="flex gap-1">
              {(['all','active','monitoring','cleared'] as FilterStatus[]).map(f => {
                const label = f === 'all' ? t('common','all') : stLabel[f as HazardStatus]
                return (
                  <button key={f} onClick={() => setFilterSt(f)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all',
                      filterSt === f
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    )}>
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Severity */}
            <div className="flex gap-1">
              {(['all','critical','high','medium','low'] as FilterSeverity[]).map(f => {
                const cfg = f === 'all' ? null : SEV_CFG[f as HazardSeverity]
                return (
                  <button key={f} onClick={() => setFilterSev(f)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all',
                      filterSev === f
                        ? cn(cfg?.bg ?? 'bg-slate-800', cfg?.color ?? 'text-white', cfg?.border ?? 'border-slate-800')
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    )}>
                    {f === 'all' ? t('common','all') : sevLabel[f as HazardSeverity]}
                  </button>
                )
              })}
            </div>

            {/* Type pills */}
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterType('all')}
                className={cn('px-2 py-1 rounded-full text-[9px] font-bold border transition-all',
                  filterType === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200')}>
                {t('hazard','allTypes')}
              </button>
              {(Object.keys(TYPE_CFG) as HazardType[]).map(tp => {
                const cfg = TYPE_CFG[tp]
                return (
                  <button key={tp} onClick={() => setFilterType(tp)}
                    className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border transition-all',
                      filterType === tp
                        ? cn(cfg.bg, cfg.color, cfg.border)
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    )}>
                    {cfg.icon} {typeLabel[tp]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hazard list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
                <CheckCircle2 size={28}/><p className="text-xs">{t('hazard','noHazards')}</p>
              </div>
            ) : filtered.map(h => {
              const tc  = TYPE_CFG[h.type]
              const sc  = SEV_CFG[h.severity]
              const stc = ST_CFG[h.status]
              const isActive = selected?.id === h.id
              return (
                <button key={h.id} onClick={() => setSelected(h)}
                  className={cn(
                    'w-full text-left rounded-xl border px-3 py-3 transition-all hover:shadow-sm',
                    isActive ? 'bg-red-50 border-red-300 shadow-sm' : 'bg-white border-slate-100 hover:border-red-100'
                  )}>
                  {/* Row 1 */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={cn('flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border', tc.bg, tc.color, tc.border)}>
                      {tc.icon} {typeLabel[h.type]}
                    </span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', sc.bg, sc.color, sc.border)}>
                      {sevLabel[h.severity]}
                    </span>
                    <span className={cn('ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full border', stc.bg, stc.color, stc.border)}>
                      {stLabel[h.status]}
                    </span>
                  </div>
                  {/* Row 2: title */}
                  <p className={cn('text-xs font-bold leading-snug truncate mb-1', isActive ? 'text-red-800' : 'text-slate-800')}>
                    {h.severity === 'critical' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 mb-0.5"/>}
                    {h.title}
                  </p>
                  {/* Row 3 */}
                  <div className="flex items-center gap-2 text-[9px] text-slate-400">
                    <span className="flex items-center gap-0.5"><MapPin size={8}/> {h.location}</span>
                    <span className="flex items-center gap-0.5 ml-auto"><Clock size={8}/> {h.updated_at}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: Map + detail panel ────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">

          {/* Map container */}
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm min-h-0">
            <div ref={mapElRef} className="w-full h-full"/>

            {/* Layer switcher */}
            <div className="absolute top-3 right-3 flex bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl overflow-hidden shadow-lg z-10">
              {([
                { key:'normal',    label:t('hazard','mapView'),       icon:<MapIcon size={11}/> },
                { key:'traffic',   label:t('hazard','trafficView'),   icon:<Radio size={11}/> },
                { key:'satellite', label:t('hazard','satelliteView'), icon:<Satellite size={11}/> },
              ] as {key:MapLayer; label:string; icon:React.ReactNode}[]).map(l => (
                <button key={l.key} onClick={() => applyLayer(l.key)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold transition-colors',
                    mapLayer === l.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                  )}>
                  {l.icon} {l.label}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-2.5 shadow-lg z-10">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('hazard','eventType')}</p>
              <div className="space-y-1">
                {(Object.keys(TYPE_CFG) as HazardType[]).map(tp => {
                  const cfg = TYPE_CFG[tp]
                  return (
                    <div key={tp} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.mapColor }}/>
                      <span className="text-[9px] text-slate-600 font-medium">{typeLabel[tp]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Severity legend */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-2.5 shadow-lg z-10">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('hazard','severity')}</p>
              <div className="space-y-1">
                {(Object.keys(SEV_CFG) as HazardSeverity[]).map(s => {
                  const cfg = SEV_CFG[s]
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }}/>
                      <span className="text-[9px] text-slate-600 font-medium">{sevLabel[s]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Detail panel (shows when selected) ─────────────────── */}
          {selected && (() => {
            const h   = hazards.find(x => x.id === selected.id) ?? selected
            const tc  = TYPE_CFG[h.type]
            const sc  = SEV_CFG[h.severity]
            const stc = ST_CFG[h.status]
            return (
              <div className="flex-shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Detail header */}
                <div className="flex items-start gap-3 px-5 py-3 border-b border-slate-100">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border', tc.bg, tc.border)}>
                    <span className={tc.color}>{tc.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', tc.bg, tc.color, tc.border)}>{typeLabel[h.type]}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', sc.bg, sc.color, sc.border)}>{sevLabel[h.severity]}</span>
                      <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full border', stc.bg, stc.color, stc.border)}>{stLabel[h.status]}</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-mono">{h.updated_at}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{h.title}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
                    <X size={13} className="text-slate-400"/>
                  </button>
                </div>

                {/* Detail body */}
                <div className="px-5 py-3 flex gap-6">
                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{h.detail}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
                      {[
                        { label:t('hazard','location'),         val: h.location          },
                        { label:t('hazard','affectedLines'),    val: h.route             },
                        { label:t('hazard','affectedVehicles'), val:`${h.affected_vehicles} ${t('hazard','units')}` },
                        { label:t('hazard','reportedBy'),       val: h.reported_by       },
                        { label:t('hazard','reportedAt'),       val: h.reported_at       },
                        { label:t('hazard','updatedAt'),        val: h.updated_at        },
                      ].map(r => (
                        <div key={r.label} className="flex items-baseline gap-1.5">
                          <span className="text-slate-400 font-semibold whitespace-nowrap">{r.label}:</span>
                          <span className="text-slate-700 font-bold truncate">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                    {h.status !== 'cleared' && (
                      <button onClick={() => markCleared(h.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded-xl shadow-sm shadow-emerald-200 transition-colors">
                        <CheckCircle2 size={12}/> {t('hazard','markResolved')}
                      </button>
                    )}
                    <button onClick={() => {
                      const map = mapRef.current
                      if (map && window.longdo) { map.location({ lat: h.lat, lon: h.lon }, true); map.zoom(14, true) }
                    }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors">
                      <Maximize2 size={12}/> {t('hazard','zoomMap')}
                    </button>
                    <button onClick={() => setSelected(null)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors">
                      <XCircle size={12}/> {t('common','close')}
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
