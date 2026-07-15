'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Radio, Clock, AlertTriangle, CheckCircle2,
  Bus, UserCheck, Settings, ArrowRight, Flame,
  Users, Flag, Plus, Trash2, XCircle, ChevronDown, ChevronUp,
  Bell, Activity, ScanLine, FileWarning, ShieldAlert, TriangleAlert,
  CheckCheck, CircleDot, Filter, Download, RotateCcw, ChevronRight,
  Cctv, Layers, Satellite, Car, Maximize2, X, RefreshCw, Wifi, WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { Post } from '@/types'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import { usePostStore } from '@/lib/stores/post.store'
import { useAttendanceStore } from '@/lib/stores/attendance.store'

const LONGDO_MAP_KEY = 'e516b73dc9f6e987181a591230bbe207'

// ─── Types ────────────────────────────────────────────────────
interface CPCfg {
  name: string; expected_time: string; threshold: number; lat: number; lon: number
}
interface RouteGroup {
  id: string; name: string; color: string; cp1: CPCfg; cp2: CPCfg
}
type CPStatus = 'pending' | 'arriving' | 'on_time' | 'delay' | 'missed'

type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
type IncidentType     = 'delay' | 'breakdown' | 'accident' | 'passenger' | 'other'
type IncidentStatus   = 'open' | 'investigating' | 'resolved' | 'closed'

interface Incident {
  id: string; post_id: string; post_code: string; route_name: string
  severity: IncidentSeverity; type: IncidentType
  title: string; detail: string
  status: IncidentStatus
  reported_at: string   // HH:MM:SS
  resolved_at?: string
  note?: string
}

interface ScanEvent {
  id: string; at: string   // HH:MM:SS
  emp_code: string; emp_name: string
  post_code: string; route_name: string
  point_name: string
  action: 'board' | 'alight'
  result: 'ok' | 'not_reserved' | 'duplicate'
}

// ─── Helpers ──────────────────────────────────────────────────
const toMin   = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const fromMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
const nowMin  = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }
const clockStr = () => new Date().toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false })
const timeStr  = () => new Date().toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false })

const seedOffset = (id: string, cp: string): number => {
  let h = 5381
  for (const c of id + cp) h = ((h << 5) + h) ^ c.charCodeAt(0)
  return (Math.abs(h) % 20) - 5
}
const calcStatus = (expectedTime: string, threshold: number, offset: number, nowM: number): CPStatus => {
  const exp = toMin(expectedTime), arr = exp + offset
  if (nowM >= arr) return offset <= threshold ? 'on_time' : 'delay'
  if (nowM >= exp + threshold + 1) return 'missed'
  if (nowM >= exp - 2) return 'arriving'
  return 'pending'
}

const STATUS_CFG: Record<CPStatus, { label: string; cls: string; dot: string }> = {
  on_time:  { label: 'ผ่านแล้ว',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: '#10b981' },
  delay:    { label: 'ล่าช้า',    cls: 'bg-red-50 text-red-600 border-red-300',             dot: '#ef4444' },
  arriving: { label: 'กำลังเข้า', cls: 'bg-amber-50 text-amber-700 border-amber-300',       dot: '#f59e0b' },
  missed:   { label: 'เกินเวลา!', cls: 'bg-red-100 text-red-800 border-red-400',            dot: '#dc2626' },
  pending:  { label: 'รอ',        cls: 'bg-slate-100 text-slate-500 border-slate-200',      dot: '#94a3b8' },
}

const SEV_CFG: Record<IncidentSeverity, { label: string; cls: string; dot: string }> = {
  low:      { label: 'ต่ำ',       cls: 'bg-sky-50 text-sky-700 border-sky-200',         dot: '#0ea5e9' },
  medium:   { label: 'ปานกลาง',   cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: '#f59e0b' },
  high:     { label: 'สูง',       cls: 'bg-orange-50 text-orange-700 border-orange-200',dot: '#f97316' },
  critical: { label: 'วิกฤต',     cls: 'bg-red-50 text-red-700 border-red-300',         dot: '#ef4444' },
}
const INC_TYPE_CFG: Record<IncidentType, { label: string; icon: React.ReactNode }> = {
  delay:     { label: 'ล่าช้า',        icon: <Clock size={11} /> },
  breakdown: { label: 'รถเสีย',        icon: <Bus size={11} /> },
  accident:  { label: 'อุบัติเหตุ',    icon: <TriangleAlert size={11} /> },
  passenger: { label: 'ปัญหาผู้โดยสาร', icon: <Users size={11} /> },
  other:     { label: 'อื่นๆ',         icon: <CircleDot size={11} /> },
}
const INC_STATUS_CFG: Record<IncidentStatus, { label: string; cls: string }> = {
  open:         { label: 'เปิด',       cls: 'bg-red-100 text-red-700 border-red-200' },
  investigating:{ label: 'กำลังตรวจ', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolved:     { label: 'แก้ไขแล้ว', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  closed:       { label: 'ปิด',        cls: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const GROUP_COLORS = ['indigo','sky','violet','emerald','rose','amber','teal','pink']
const FACTORY = { lat: 13.8361, lon: 100.5231 }
const VEHICLE_STARTS = [
  { lat: 13.7150, lon: 100.4380 },
  { lat: 13.8050, lon: 100.4720 },
  { lat: 13.6850, lon: 100.5620 },
]
const getVehiclePos = (idx: number, nowM: number, shiftMin: number) => {
  const start = VEHICLE_STARTS[idx % VEHICLE_STARTS.length]
  const elapsed = Math.max(0, nowM - shiftMin + 30)
  const progress = Math.min(1, elapsed / 60)
  return {
    lat: start.lat + (FACTORY.lat - start.lat) * progress + Math.sin(idx * 2.7 + nowM * 0.01) * 0.003,
    lon: start.lon + (FACTORY.lon - start.lon) * progress + Math.cos(idx * 1.9 + nowM * 0.01) * 0.003,
  }
}

const DEFAULT_GROUPS: RouteGroup[] = [
  {
    id: 'grp-1', name: 'สายเหนือ', color: 'indigo',
    cp1: { name: 'ประตูนิคม A',   expected_time: '06:30', threshold: 5, lat: 13.7700, lon: 100.4700 },
    cp2: { name: 'ลานจอดโรงงาน', expected_time: '07:00', threshold: 5, lat: 13.8200, lon: 100.5100 },
  },
  {
    id: 'grp-2', name: 'สายใต้', color: 'violet',
    cp1: { name: 'ด่านตรวจ B',    expected_time: '06:45', threshold: 5, lat: 13.7400, lon: 100.5200 },
    cp2: { name: 'จุดรับส่งหลัก', expected_time: '07:15', threshold: 5, lat: 13.8100, lon: 100.5150 },
  },
]

// ─── Seed scan events ──────────────────────────────────────────
const SEED_SCANS: ScanEvent[] = [
  { id:'sc-1', at:'06:28:14', emp_code:'930920', emp_name:'ดาวนุ่น เพรียนดี', post_code:'POST-001', route_name:'สาย A - เส้นทางเหนือ', point_name:'BTS หมอชิต', action:'board', result:'ok' },
  { id:'sc-2', at:'06:29:03', emp_code:'452020', emp_name:'มนตรี วังสา', post_code:'POST-002', route_name:'สาย B - เส้นทางใต้', point_name:'BTS เอกมัย', action:'board', result:'ok' },
  { id:'sc-3', at:'06:30:55', emp_code:'858416', emp_name:'อำพร อุ้มเงิน', post_code:'POST-001', route_name:'สาย A - เส้นทางเหนือ', point_name:'สวนจตุจักร', action:'board', result:'ok' },
  { id:'sc-4', at:'06:31:42', emp_code:'748446', emp_name:'ปราณี มีนาค', post_code:'POST-003', route_name:'สาย C - เส้นทางตะวันออก', point_name:'มีนบุรี', action:'board', result:'ok' },
  { id:'sc-5', at:'06:33:11', emp_code:'223311', emp_name:'สมชาย ใจดี', post_code:'POST-002', route_name:'สาย B - เส้นทางใต้', point_name:'อ่อนนุช', action:'board', result:'not_reserved' },
  { id:'sc-6', at:'06:35:28', emp_code:'930920', emp_name:'ดาวนุ่น เพรียนดี', post_code:'POST-001', route_name:'สาย A - เส้นทางเหนือ', point_name:'ลานจอดโรงงาน', action:'alight', result:'ok' },
]
const SEED_INCIDENTS: Incident[] = [
  { id:'inc-1', post_id:'post-2', post_code:'POST-002', route_name:'สาย B - เส้นทางใต้', severity:'high', type:'delay', title:'รถติดหนักแยกพระโขนง', detail:'ติดแอร์โรทรัพย์จากอุบัติเหตุรถชน ล่าช้าประมาณ 18 นาที', status:'investigating', reported_at:'06:40:05' },
  { id:'inc-2', post_id:'post-3', post_code:'POST-003', route_name:'สาย C - เส้นทางตะวันออก', severity:'low', type:'passenger', title:'ผู้โดยสารลืมสัมภาระบนรถ', detail:'มีกระเป๋าสะพายลืมไว้ที่เบาะหลัง ติดต่อคนขับแล้ว', status:'resolved', reported_at:'06:55:30', resolved_at:'07:10:00' },
]

// ─── Traffic Camera (Longdo) ──────────────────────────────────
interface TrafficCamera {
  title: string
  camid: string
  latitude: string
  longitude: string
  incity: string
  organization: string
  vdourl: string
  imgurl: string
  hls_url?: string
}

type LMap    = LongdoMap
type LMarker = LongdoMarker

// ─── HLS / MJPEG player (dynamic import avoids SSR crash) ────
function CameraViewer({ cam, onError }: { cam: TrafficCamera; onError: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (!cam.hls_url) return
    const proxied = `/api/hls-proxy?url=${encodeURIComponent(cam.hls_url)}`
    let hls: { destroy(): void } | null = null
    import('hls.js').then(({ default: Hls }) => {
      if (!videoRef.current) return
      if (Hls.isSupported()) {
        const instance = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 30, enableWorker: true })
        hls = instance
        instance.loadSource(proxied)
        instance.attachMedia(videoRef.current)
        instance.on(Hls.Events.MANIFEST_PARSED, () => { videoRef.current?.play().catch(() => {}) })
        instance.on(Hls.Events.ERROR, (_e: unknown, data: { fatal: boolean }) => { if (data.fatal) onError() })
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = proxied
        videoRef.current.play().catch(() => {})
      }
    })
    return () => { hls?.destroy() }
  }, [cam.camid, cam.hls_url, onError])

  if (cam.hls_url) {
    return <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={cam.camid}
      src={`/api/cam-proxy?url=${encodeURIComponent(cam.vdourl)}`}
      alt=""
      className="w-full h-full object-cover"
      onError={onError}
    />
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function OperationsPage() {
  const {  attendances } = useAttendanceStore()
    const { posts} = usePostStore()
  const { routes: allRoutes } = useRoutePointStore()
  const { t } = useLang()
  const activePosts  = useMemo(() => posts.filter(p => p.is_status === 'active'), [posts])
  const activeRoutes = useMemo(() => allRoutes.filter(r => r.is_status === 'active'), [allRoutes])

  // Computed translation maps for module-level constants
  const cpStatusLabel: Record<CPStatus, string> = {
    on_time:  t('operations','cpOnTime'),
    delay:    t('operations','cpDelay'),
    arriving: t('operations','cpArriving'),
    missed:   t('operations','cpMissed'),
    pending:  t('operations','cpPending'),
  }
  const sevLabel: Record<IncidentSeverity, string> = {
    low:      t('operations','sevLow'),
    medium:   t('operations','sevMedium'),
    high:     t('operations','sevHigh'),
    critical: t('operations','sevCritical'),
  }
  const incTypeLabel: Record<IncidentType, string> = {
    delay:     t('operations','incDelay'),
    breakdown: t('operations','incBreakdown'),
    accident:  t('operations','incAccident'),
    passenger: t('operations','incPassenger'),
    other:     t('operations','incOther'),
  }
  const incStatusLabel: Record<IncidentStatus, string> = {
    open:          t('operations','incOpen'),
    investigating: t('operations','incInvestigating'),
    resolved:      t('operations','incResolved'),
    closed:        t('operations','incClosed'),
  }

  const [activeTab, setActiveTab] = useState<'board' | 'scanlog' | 'incidents' | 'cctv'>('board')

  // Map layer & CCTV state
  const [mapLayer, setMapLayer]           = useState<'normal'|'traffic'|'satellite'>('normal')
  const [cameras, setCameras]             = useState<TrafficCamera[]>([])
  const [camLoading, setCamLoading]       = useState(false)
  const [selectedCam, setSelectedCam]     = useState<TrafficCamera | null>(null)
  const [camProvince, setCamProvince]     = useState('all')
  const [camSearch, setCamSearch]         = useState('')
  const [camFullscreen, setCamFullscreen] = useState(false)
  const [imgTs, setImgTs]                 = useState(() => Date.now())
  const [camErrSet, setCamErrSet]         = useState<Set<string>>(new Set())
  const camMarkersRef = useRef<LMarker[]>([])

  // Fetch traffic cameras from Longdo on mount
  useEffect(() => {
    setCamLoading(true)
    fetch('/api/traffic-cameras')
      .then(r => r.json())
      .then((res: { data?: TrafficCamera[] }) => { setCameras(res.data ?? []); setCamLoading(false) })
      .catch(() => setCamLoading(false))
  }, [])

  // Refresh snapshot timestamps every 15 s
  useEffect(() => {
    const t = setInterval(() => setImgTs(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [])

  // Derive province list from loaded cameras
  const provinceList = useMemo(() => {
    const prov = new Set<string>()
    cameras.forEach(c => {
      const m = c.title.match(/\(([^)]+)\)/)
      if (m) prov.add(m[1])
    })
    return Array.from(prov).sort().map(orig => ({
      orig,
      display: orig.startsWith('จ.') ? orig.slice(2) : orig,
    }))
  }, [cameras])

  // Filter cameras by province + search
  const filteredCameras = useMemo(() => {
    let list = cameras
    if (camProvince !== 'all' && camProvince !== 'ชลบุรี') {
      list = list.filter(c => c.title.includes(`(${camProvince})`))
    }
    if (camSearch.trim()) {
      const q = camSearch.toLowerCase()
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.camid.toLowerCase().includes(q))
    }
    return list
  }, [cameras, camProvince, camSearch])

  // Clock
  const [tick, setTick]   = useState(0)
  const [clock, setClock] = useState('--:--:--')
  const [nowM, setNowM]   = useState(0)
  useEffect(() => {
    setClock(clockStr()); setNowM(nowMin())
    const t = setInterval(() => { setTick(x => x+1); setClock(clockStr()); setNowM(nowMin()) }, 1000)
    return () => clearInterval(t)
  }, [])

  // Groups
  const [groups, setGroups]             = useState<RouteGroup[]>(DEFAULT_GROUPS)
  const [routeGroupMap, setRouteGroupMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(activeRoutes.map((r, i) => [r.id, i < 2 ? 'grp-1' : 'grp-2']))
  )
  const [expandedGrp, setExpGrp] = useState<string | null>(null)
  const [editGrp, setEditGrp]    = useState<RouteGroup | null>(null)
  const [addingTo, setAddingTo]  = useState<string | null>(null)

  const unassignedRoutes = useMemo(
    () => activeRoutes.filter(r => !routeGroupMap[r.id]), [activeRoutes, routeGroupMap]
  )
  const addRouteToGroup    = (routeId: string, gid: string) => setRouteGroupMap(m => ({ ...m, [routeId]: gid }))
  const removeRouteFromGroup = (routeId: string) => setRouteGroupMap(m => { const n={...m}; delete n[routeId]; return n })

  // ── Incidents state (must be before postStatuses useMemo) ───
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS)
  const [showIncForm, setShowIncForm] = useState(false)
  const [incForm, setIncForm] = useState<Partial<Incident>>({
    severity: 'medium', type: 'delay', status: 'open'
  })
  const [incFilter, setIncFilter] = useState<IncidentStatus | 'all'>('all')
  const [flagging, setFlagging]   = useState<string | null>(null)
  const [flagNote, setFlagNote]   = useState('')

  // Offsets
  const offsets = useRef<Record<string, { cp1: number; cp2: number }>>({})
  useMemo(() => {
    activePosts.forEach(p => { if (!offsets.current[p.id]) offsets.current[p.id] = { cp1: seedOffset(p.id,'cp1'), cp2: seedOffset(p.id,'cp2') } })
  }, [activePosts])

  const postStatuses = useMemo(() => activePosts.map((p, idx) => {
    const grpId  = p.route_id ? routeGroupMap[p.route_id] : undefined
    const group  = grpId ? groups.find(g => g.id === grpId) : undefined
    const off    = offsets.current[p.id] ?? { cp1:0, cp2:3 }
    const shiftM = toMin(p.shift?.default_time ?? '07:00')
    const pos    = getVehiclePos(idx, nowM, shiftM)
    const dv     = p.driver_vehicle_vendor?.driver_vehicle
    const pax    = attendances.filter(a => a.post_id === p.id).length
    const hasInc = incidents.some(i => i.post_id === p.id && i.status !== 'closed')
    const cp1S = group ? calcStatus(group.cp1.expected_time, group.cp1.threshold, off.cp1, nowM) : 'pending' as CPStatus
    const cp2S = group ? calcStatus(group.cp2.expected_time, group.cp2.threshold, off.cp2, nowM) : 'pending' as CPStatus
    const isDelay = cp1S === 'delay' || cp1S === 'missed' || cp2S === 'delay' || cp2S === 'missed'
    const markerColor = hasInc ? '#f97316' : isDelay ? '#ef4444' : cp1S === 'on_time' ? '#10b981' : '#6366f1'
    return { p, idx, grpId, group, off, pos, dv, pax, hasInc, cp1S, cp2S, isDelay, markerColor }
  }), [activePosts, routeGroupMap, groups, nowM, attendances]) // eslint-disable-line

  const totalDelay = postStatuses.filter(s => s.isDelay).length

  const submitIncident = () => {
    if (!incForm.title?.trim() || !incForm.post_code?.trim()) return
    const now = timeStr()
    setIncidents(prev => [{
      id: `inc-${Date.now()}`,
      post_id: incForm.post_id ?? '',
      post_code: incForm.post_code ?? '',
      route_name: incForm.route_name ?? '-',
      severity: incForm.severity ?? 'medium',
      type: incForm.type ?? 'other',
      title: incForm.title ?? '',
      detail: incForm.detail ?? '',
      status: 'open',
      reported_at: now,
    }, ...prev])
    setIncForm({ severity: 'medium', type: 'delay', status: 'open' })
    setShowIncForm(false)
  }

  const resolveIncident = (id: string) => {
    setIncidents(prev => prev.map(i => i.id===id ? { ...i, status:'resolved', resolved_at: timeStr() } : i))
  }
  const closeIncident = (id: string) => {
    setIncidents(prev => prev.map(i => i.id===id ? { ...i, status:'closed' } : i))
  }

  // ── Scan Log state ───────────────────────────────────────────
  const [scanLog, setScanLog] = useState<ScanEvent[]>(SEED_SCANS)
  const [scanFilter, setScanFilter] = useState<'all'|'ok'|'not_reserved'|'duplicate'>('all')
  const [scanSearch, setScanSearch] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Simulate new scans every ~8 seconds when autoRefresh on
  const DUMMY_NAMES = ['สุภาพร นาคดี','วิรัตน์ สวยงาม','นิยม คงคา','พิมพ์ใจ ทองดี','ชาญ เรืองแสง','แสงดาว มีสุข']
  const DUMMY_POINTS = ['BTS หมอชิต','สวนจตุจักร','BTS เอกมัย','อ่อนนุช','มีนบุรี','ลาดกระบัง']
  const DUMMY_POSTS  = activePosts.length > 0
    ? activePosts.map(p => ({ code: p.code, route: p.route?.name_th ?? '-' }))
    : [{ code:'POST-001', route:'สาย A' },{ code:'POST-002', route:'สาย B' }]

  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => {
      const name  = DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)]
      const post  = DUMMY_POSTS[Math.floor(Math.random() * DUMMY_POSTS.length)]
      const point = DUMMY_POINTS[Math.floor(Math.random() * DUMMY_POINTS.length)]
      const results: ScanEvent['result'][] = ['ok','ok','ok','ok','not_reserved','duplicate']
      setScanLog(prev => [{
        id: `sc-${Date.now()}`,
        at: timeStr(),
        emp_code: String(100000 + Math.floor(Math.random() * 900000)),
        emp_name: name,
        post_code: post.code,
        route_name: post.route,
        point_name: point,
        action: Math.random() > 0.3 ? 'board' : 'alight',
        result: results[Math.floor(Math.random() * results.length)],
      }, ...prev.slice(0, 99)])
    }, 8000)
    return () => clearInterval(t)
  }, [autoRefresh, activePosts]) // eslint-disable-line

  const filteredScans = useMemo(() => {
    let s = scanLog
    if (scanFilter !== 'all') s = s.filter(e => e.result === scanFilter)
    if (scanSearch.trim()) {
      const q = scanSearch.toLowerCase()
      s = s.filter(e => e.emp_name.toLowerCase().includes(q) || e.emp_code.includes(q) || e.post_code.toLowerCase().includes(q))
    }
    return s
  }, [scanLog, scanFilter, scanSearch])

  const filteredIncidents = useMemo(() => {
    if (incFilter === 'all') return incidents
    return incidents.filter(i => i.status === incFilter)
  }, [incidents, incFilter])

  // ── Longdo Map ───────────────────────────────────────────────
  const mapElRef    = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<LMap | null>(null)
  const markersRef  = useRef<Map<string, LMarker>>(new Map())
  const cpMarkersRef = useRef<LMarker[]>([])

  const buildMarkerHtml = (s: typeof postStatuses[0]) =>
    `<div style="background:${s.markerColor};border:2px solid white;border-radius:10px;padding:4px 8px;color:white;font-size:10px;font-weight:700;font-family:monospace;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;cursor:pointer;display:flex;align-items:center;gap:4px;">
      🚌 ${s.dv?.vehicle?.license ?? s.p.code}
      ${s.isDelay ? '<span style="background:white;color:#ef4444;border-radius:4px;padding:0 3px;font-size:9px">!</span>' : ''}
    </div>`

  const initMap = useCallback(() => {
    if (!mapElRef.current || !window.longdo || mapRef.current) return
    const map = new window.longdo.Map({
      placeholder: mapElRef.current, zoom: 11, lastView: false,
      location: { lat: 13.76, lon: 100.49 },
    })
    mapRef.current = map
    const factory = new window.longdo.Marker(FACTORY, { icon: {
      html: `<div style="background:#1e293b;color:white;padding:4px 8px;border-radius:8px;font-size:10px;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🏭 Factory</div>`,
      offset: { x:35, y:20 },
    }})
    map.Overlays.add(factory)
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

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.longdo) return
    postStatuses.forEach(s => {
      const ex = markersRef.current.get(s.p.id)
      if (ex) { map.Overlays.remove(ex); markersRef.current.delete(s.p.id) }
      const marker = new window.longdo.Marker(
        { lat: s.pos.lat, lon: s.pos.lon },
        { icon: { html: buildMarkerHtml(s), offset: { x:40, y:20 } } }
      )
      map.Overlays.add(marker)
      markersRef.current.set(s.p.id, marker)
    })
  }, [postStatuses, tick]) // eslint-disable-line

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.longdo) return
    cpMarkersRef.current.forEach(m => map.Overlays.remove(m))
    cpMarkersRef.current = []
    const colorMap: Record<string, string> = {
      indigo:'#6366f1', sky:'#0ea5e9', violet:'#8b5cf6', emerald:'#10b981',
      rose:'#f43f5e', amber:'#f59e0b', teal:'#14b8a6', pink:'#ec4899',
    }
    groups.forEach(g => {
      const c = colorMap[g.color] ?? '#6366f1'
      ;[{ cp:g.cp1, label:'CP1' },{ cp:g.cp2, label:'CP2' }].forEach(({ cp, label }) => {
        const m = new window.longdo.Marker(
          { lat:cp.lat, lon:cp.lon },
          { icon: { html:`<div style="background:white;border:3px solid ${c};border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:${c};box-shadow:0 2px 6px rgba(0,0,0,0.2)">${label}</div>`, offset:{x:14,y:14} } }
        )
        map.Overlays.add(m); cpMarkersRef.current.push(m)
      })
    })
  }, [groups])

  // Camera markers on map — only incity cameras, max 80
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.longdo || cameras.length === 0) return
    camMarkersRef.current.forEach(m => map.Overlays.remove(m))
    camMarkersRef.current = []
    cameras.slice(0, 150).forEach(cam => {
      const lat = parseFloat(cam.latitude), lon = parseFloat(cam.longitude)
      if (isNaN(lat) || isNaN(lon)) return
      const label = cam.title.replace(/\([^)]+\)\s*/, '').slice(0, 20)
      const m = new window.longdo.Marker(
        { lat, lon },
        { icon: { html: `<div style="background:#7c3aed;color:white;padding:3px 7px;border-radius:8px;font-size:9px;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(124,58,237,0.4);cursor:pointer;white-space:nowrap;">📹 ${label}</div>`, offset:{x:40,y:16} } }
      )
      window.longdo.Event.bind(m, 'click', () => { setSelectedCam(cam); setActiveTab('cctv') })
      map.Overlays.add(m)
      camMarkersRef.current.push(m)
    })
  }, [cameras]) // eslint-disable-line

  // Map layer switcher
  const applyLayer = useCallback((layer: 'normal'|'traffic'|'satellite') => {
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
    } catch { /* ignore if layer not supported */ }
  }, [])

  // ── Group CRUD ───────────────────────────────────────────────
  const addGroup = () => {
    const id = `grp-${Date.now()}`
    const m  = nowMin()
    const colorIdx = groups.length % GROUP_COLORS.length
    const newG: RouteGroup = {
      id, name: `${t('operations','newGroup')} ${groups.length+1}`, color: GROUP_COLORS[colorIdx],
      cp1: { name:'Checkpoint 1', expected_time: fromMin(m-5), threshold:5, lat:13.75, lon:100.47 },
      cp2: { name:'Checkpoint 2', expected_time: fromMin(m+15), threshold:5, lat:13.82, lon:100.51 },
    }
    setGroups(gs => [...gs, newG]); setExpGrp(id); setEditGrp(newG)
  }
  const removeGroup = (id: string) => {
    setGroups(gs => gs.filter(g => g.id !== id))
    setRouteGroupMap(m => { const n={...m}; Object.keys(n).forEach(k => { if(n[k]===id) delete n[k] }); return n })
  }
  const saveGroup = () => {
    if (!editGrp) return
    setGroups(gs => gs.map(g => g.id===editGrp.id ? editGrp : g))
    setExpGrp(null); setEditGrp(null)
  }

  const colorBorder: Record<string, string> = {
    indigo:'border-indigo-300 bg-indigo-50/60', sky:'border-sky-300 bg-sky-50/60',
    violet:'border-violet-300 bg-violet-50/60', emerald:'border-emerald-300 bg-emerald-50/60',
    rose:'border-rose-300 bg-rose-50/60', amber:'border-amber-300 bg-amber-50/60',
    teal:'border-teal-300 bg-teal-50/60', pink:'border-pink-300 bg-pink-50/60',
  }
  const colorText: Record<string, string> = {
    indigo:'text-indigo-700', sky:'text-sky-700', violet:'text-violet-700', emerald:'text-emerald-700',
    rose:'text-rose-700', amber:'text-amber-700', teal:'text-teal-700', pink:'text-pink-700',
  }
  const colorBadge: Record<string, string> = {
    indigo:'bg-indigo-100 text-indigo-700', sky:'bg-sky-100 text-sky-700',
    violet:'bg-violet-100 text-violet-700', emerald:'bg-emerald-100 text-emerald-700',
    rose:'bg-rose-100 text-rose-700', amber:'bg-amber-100 text-amber-700',
    teal:'bg-teal-100 text-teal-700', pink:'bg-pink-100 text-pink-700',
  }

  const incOpen = incidents.filter(i => i.status === 'open').length
  const incActive = incidents.filter(i => i.status !== 'closed').length
  const scanAnomalies = scanLog.filter(s => s.result !== 'ok').length

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
            <Radio size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Control Center</h1>
            <p className="text-xs text-slate-400 mt-0.5">Real-time · Checkpoint · Scan Log · Incidents</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-sm font-mono font-bold tracking-widest">{clock}</span>
          </div>
          {totalDelay > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="animate-pulse" />
              <span className="text-xs font-bold">{totalDelay} {t('operations','cpDelay')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        {[
          { icon:<Bus size={13} className="text-slate-400"/>, label:'active posts', value:postStatuses.length, cls:'text-slate-700' },
          { icon:<CheckCircle2 size={13} className="text-emerald-400"/>, label:'on-time', value:postStatuses.filter(s=>s.cp1S==='on_time'||s.cp2S==='on_time').length, cls:'text-emerald-700' },
          { icon:<AlertTriangle size={13} className="text-red-400"/>, label:'delay', value:totalDelay, cls:'text-red-600' },
          { icon:<ScanLine size={13} className="text-sky-400"/>, label:'scans today', value:scanLog.length, cls:'text-sky-700' },
          { icon:<Flame size={13} className="text-orange-400"/>, label:'incidents', value:incActive, cls:'text-orange-600' },
          { icon:<Activity size={13} className="text-indigo-400"/>, label:t('operations','groupCount'), value:groups.length, cls:'text-indigo-600' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
            {s.icon}
            <span className={`text-sm font-bold ${s.cls}`}>{s.value}</span>
            <span className="text-[10px] text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit flex-shrink-0">
        {([
          { key:'board',     label:'Live Board',                    icon:<Bus size={13}/>,         badge: totalDelay > 0 ? totalDelay : 0 },
          { key:'scanlog',   label:'Scan Log',                      icon:<ScanLine size={13}/>,    badge: scanAnomalies > 0 ? scanAnomalies : 0 },
          { key:'incidents', label:t('operations','incReport'),     icon:<FileWarning size={13}/>, badge: incOpen > 0 ? incOpen : 0 },
          { key:'cctv',      label:'CCTV',                          icon:<Cctv size={13}/>,        badge: 0 },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === t.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {t.icon}
            {t.label}
            {t.badge > 0 && (
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                activeTab === t.key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
              )}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB: LIVE BOARD ═══════════════════ */}
      {activeTab === 'board' && (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Map container with layer controls */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative" style={{ height:520 }}>
              <div ref={mapElRef} className="w-full h-full" />
              {/* Layer switcher overlay */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-1 shadow-sm">
                {([
                  { key:'normal',    label:'Normal',    icon:<Layers size={11}/>    },
                  { key:'traffic',   label:'Traffic',   icon:<Car size={11}/>       },
                  { key:'satellite', label:'Satellite', icon:<Satellite size={11}/> },
                ] as const).map(l => (
                  <button key={l.key} onClick={() => applyLayer(l.key)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all',
                      mapLayer === l.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                    )}>
                    {l.icon} {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{t('operations','legend')}</span>
              {[
                { dot:'#10b981', label:t('operations','cpOnTime') },{ dot:'#ef4444', label:t('operations','cpDelay') },
                { dot:'#f97316', label:t('operations','incident') },{ dot:'#6366f1', label:t('operations','running') },{ dot:'#94a3b8', label:t('operations','cpPending') },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:l.dot }} />
                  <span className="text-[10px] text-slate-600">{l.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center">
                  <span className="text-[7px] font-black text-indigo-600">CP</span>
                </div>
                <span className="text-[10px] text-slate-500">{t('operations','checkpoints')}</span>
              </div>
            </div>
            {(totalDelay > 0 || incidents.filter(i=>i.status==='open').length > 0) && (
              <div className="bg-white border border-red-100 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><Bell size={11}/> {t('operations','alertLog')}</p>
                {postStatuses.filter(s => s.isDelay || s.hasInc).map(s => (
                  <div key={s.p.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="font-mono font-bold text-slate-700">{s.p.code}</span>
                    <span className="text-slate-500">{s.p.route?.name_th}</span>
                    {(s.cp1S==='delay'||s.cp1S==='missed') && <span className="text-red-500 text-[10px]">CP1 {t('operations','cpDelayed')}</span>}
                    {(s.cp2S==='delay'||s.cp2S==='missed') && <span className="text-red-500 text-[10px]">CP2 {t('operations','cpDelayed')}</span>}
                    {s.hasInc && incidents.filter(i=>i.post_id===s.p.id).map((inc,i) => (
                      <span key={i} className="text-orange-500 text-[10px]">🔥 {inc.title}</span>
                    ))}
                    <span className="ml-auto text-[10px] text-slate-400 font-mono">{clock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Groups panel */}
          <div className="w-[420px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight:'calc(100vh - 200px)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('operations','checkpoints')}</span>
              <Button variant="secondary" size="sm" icon={<Plus size={13}/>} onClick={addGroup}>{t('operations','addGroup')}</Button>
            </div>
            {groups.map(grp => {
              const grpRoutes  = activeRoutes.filter(r => routeGroupMap[r.id] === grp.id)
              const grpDelay   = grpRoutes.reduce((acc,r) => acc + postStatuses.filter(s=>s.p.route_id===r.id&&s.isDelay).length, 0)
              const isEditing  = expandedGrp === grp.id
              const isAddHere  = addingTo === grp.id
              const available  = activeRoutes.filter(r => routeGroupMap[r.id] !== grp.id)
              return (
                <div key={grp.id} className={`rounded-2xl border p-3 space-y-3 ${colorBorder[grp.color]??'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorBadge[grp.color]??'bg-slate-100 text-slate-600'}`}>{grp.name}</span>
                    <span className="text-[10px] text-slate-400">{grpRoutes.length} {t('operations','routeCount')}</span>
                    {grpDelay > 0 && <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-bold animate-pulse">{grpDelay} {t('operations','cpDelayed')}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => setAddingTo(isAddHere ? null : grp.id)} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${isAddHere?'bg-indigo-100 text-indigo-700':'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                        <Plus size={11}/> {t('operations','addRoute')}
                      </button>
                      <button onClick={() => { setExpGrp(isEditing?null:grp.id); setEditGrp(isEditing?null:{...grp}) }} className="p-1 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors">
                        {isEditing ? <ChevronUp size={13}/> : <Settings size={13}/>}
                      </button>
                      {groups.length > 1 && <button onClick={() => removeGroup(grp.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={13}/></button>}
                    </div>
                  </div>

                  {isAddHere && (
                    <div className="rounded-xl border border-indigo-200 bg-white p-2 space-y-1">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase px-1 mb-1.5">{t('operations','addRoute')}</p>
                      {available.length === 0 ? (
                        <p className="text-[10px] text-slate-400 text-center py-2">{t('operations','noRouteLeft')}</p>
                      ) : available.map(r => {
                        const inOther = !!routeGroupMap[r.id]
                        const otherName = inOther ? groups.find(g=>g.id===routeGroupMap[r.id])?.name : null
                        return (
                          <button key={r.id} onClick={() => { addRouteToGroup(r.id,grp.id); setAddingTo(null) }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors text-left">
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0"><Bus size={11} className="text-indigo-600"/></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">{r.name_th}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{r.code} · {r.trip_direction === 'inbound' ? 'เที่ยวเข้า' : r.trip_direction === 'outbound' ? 'เที่ยวออก' : '-'}</p>
                            </div>
                            {otherName ? <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">{t('operations','movedFrom')} {otherName}</span> : <span className="text-[9px] text-slate-400 flex-shrink-0">{t('operations','noGroup')}</span>}
                          </button>
                        )
                      })}
                      <button onClick={() => setAddingTo(null)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 pt-1 border-t border-slate-100 mt-1">{t('common','cancel')}</button>
                    </div>
                  )}

                  {isEditing && editGrp && editGrp.id === grp.id && (
                    <div className="space-y-3 bg-white/80 rounded-xl border border-white p-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">{t('operations','groupName')}</label>
                        <input className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-indigo-400" value={editGrp.name} onChange={e=>setEditGrp(g=>g?{...g,name:e.target.value}:g)} />
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {GROUP_COLORS.map(c => (
                          <button key={c} onClick={() => setEditGrp(g=>g?{...g,color:c}:g)} className={`w-5 h-5 rounded-full border-2 transition-all ${colorBadge[c]?.split(' ')[0]} ${editGrp.color===c?'border-slate-600 scale-125':'border-transparent'}`} />
                        ))}
                      </div>
                      {(['cp1','cp2'] as const).map(key => (
                        <div key={key} className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{key.toUpperCase()}</p>
                          <input className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white outline-none" placeholder={t('operations','cpNamePlaceholder')} value={editGrp[key].name} onChange={e=>setEditGrp(g=>g?{...g,[key]:{...g[key],name:e.target.value}}:g)} />
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[9px] text-slate-400">{t('operations','scheduledTime')}</label>
                              <input type="time" className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none font-mono" value={editGrp[key].expected_time} onChange={e=>setEditGrp(g=>g?{...g,[key]:{...g[key],expected_time:e.target.value}}:g)} />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400">{t('operations','thresholdLabel')}</label>
                              <input type="number" min={0} max={30} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none font-mono" value={editGrp[key].threshold} onChange={e=>setEditGrp(g=>g?{...g,[key]:{...g[key],threshold:+e.target.value}}:g)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[9px] text-slate-400">Latitude</label>
                              <input type="number" step="0.0001" className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none font-mono" value={editGrp[key].lat} onChange={e=>setEditGrp(g=>g?{...g,[key]:{...g[key],lat:+e.target.value}}:g)} />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400">Longitude</label>
                              <input type="number" step="0.0001" className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none font-mono" value={editGrp[key].lon} onChange={e=>setEditGrp(g=>g?{...g,[key]:{...g[key],lon:+e.target.value}}:g)} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="primary" size="sm" onClick={saveGroup}>{t('common','save')}</Button>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1.5 text-[10px] px-1">
                      <span className="text-slate-400">{t('operations','departure')}</span>
                      <div className="flex-1 h-px bg-slate-200" />
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-[9px] border-current ${colorText[grp.color]}`}>CP1</div>
                        <span className="font-mono font-bold text-slate-600">{grp.cp1.expected_time}</span>
                      </div>
                      <div className="flex-1 h-px bg-slate-200" />
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-[9px] border-current ${colorText[grp.color]}`}>CP2</div>
                        <span className="font-mono font-bold text-slate-600">{grp.cp2.expected_time}</span>
                      </div>
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-slate-400">{t('operations','route')}</span>
                    </div>
                  )}

                  {grpRoutes.length === 0 && <p className="text-center text-[10px] text-slate-400 py-2">{t('operations','noRouteInGroup')}</p>}

                  {grpRoutes.map(route => {
                    const routePosts = postStatuses.filter(s => s.p.route_id === route.id)
                    return (
                      <div key={route.id} className="space-y-1.5">
                        <div className="flex items-center gap-2 px-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colorBadge[grp.color]?.split(' ')[0]??'bg-slate-300'}`} />
                          <span className="text-[11px] font-bold text-slate-700 flex-1 min-w-0 truncate">{route.name_th}</span>
                          <span className="text-[9px] font-mono text-slate-400">{route.code}</span>
                          <button onClick={() => removeRouteFromGroup(route.id)} className="p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><XCircle size={12}/></button>
                        </div>
                        {routePosts.length === 0 ? (
                          <div className="ml-4 text-[9px] text-slate-300 italic">{t('operations','noPostToday')}</div>
                        ) : routePosts.map(s => {
                          const { p, dv, pax, hasInc, cp1S, cp2S, isDelay } = s
                          const chip = (st: CPStatus, time: string) => {
                            const cfg = STATUS_CFG[st]
                            return (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.cls}`}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:cfg.dot }}/>
                                {cpStatusLabel[st]} {time}
                              </span>
                            )
                          }
                          const cp1ArrTime = fromMin(toMin(grp.cp1.expected_time)+s.off.cp1)
                          const cp2ArrTime = fromMin(toMin(grp.cp2.expected_time)+s.off.cp2)
                          return (
                            <div key={p.id} className={`ml-4 rounded-xl border bg-white p-2.5 space-y-2 transition-all ${hasInc?'border-orange-300 shadow-sm shadow-orange-100':isDelay?'border-red-200 shadow-sm shadow-red-100':'border-slate-200'}`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isDelay?'bg-red-100':hasInc?'bg-orange-100':'bg-indigo-100'}`}>
                                  {isDelay?<AlertTriangle size={11} className="text-red-500"/>:hasInc?<Flame size={11} className="text-orange-500"/>:<Bus size={11} className="text-indigo-600"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-slate-700">{p.code}</span>
                                    {isDelay && <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold">DELAY</span>}
                                    {hasInc  && <span className="text-[8px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded font-bold">INC</span>}
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                                    <span className="flex items-center gap-0.5"><UserCheck size={8}/>{dv?.driver?`${dv.driver.first_name_th} ${dv.driver.last_name_th}`:'-'}</span>
                                    <span className="flex items-center gap-0.5 font-mono font-bold text-slate-600"><Bus size={8}/>{dv?.vehicle?.license??'-'}</span>
                                    <span className="ml-auto flex items-center gap-0.5"><Users size={8}/> {pax}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[8px] text-slate-400 uppercase">CP1 · {grp.cp1.name}</span>
                                  {chip(cp1S, cp1ArrTime)}
                                </div>
                                <ArrowRight size={9} className="text-slate-300 flex-shrink-0 mt-3"/>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[8px] text-slate-400 uppercase">CP2 · {grp.cp2.name}</span>
                                  {chip(cp2S, cp2ArrTime)}
                                </div>
                                <button onClick={() => setFlagging(f=>f===p.id?null:p.id)} className={`ml-auto p-1 rounded-lg transition-colors flex-shrink-0 ${flagging===p.id?'bg-orange-100 text-orange-500':'text-slate-300 hover:text-orange-400 hover:bg-orange-50'}`} title={t('operations','flagIncident')}>
                                  <Flag size={10}/>
                                </button>
                              </div>
                              {flagging === p.id && (
                                <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-2 py-1.5 border border-orange-200">
                                  <input autoFocus className="flex-1 text-[10px] bg-transparent outline-none text-orange-800 placeholder:text-orange-300" placeholder={t('operations','flagPlaceholder')} value={flagNote} onChange={e=>setFlagNote(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key==='Enter' && flagNote.trim()) {
                                        setIncidents(prev=>[{
                                          id:`inc-${Date.now()}`, post_id:p.id, post_code:p.code, route_name:p.route?.name_th??'-',
                                          severity:'medium', type:'other', title:flagNote.trim(), detail:'', status:'open', reported_at:timeStr(),
                                        },...prev])
                                        setFlagging(null); setFlagNote('')
                                      }
                                      if (e.key==='Escape') { setFlagging(null); setFlagNote('') }
                                    }}
                                  />
                                  <button onClick={() => { setFlagging(null); setFlagNote('') }} className="text-[9px] text-orange-400">✕</button>
                                </div>
                              )}
                              {incidents.filter(i=>i.post_id===p.id&&i.status!=='closed').map((inc,i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] text-orange-700 bg-orange-50 rounded-lg px-2 py-1 border border-orange-100">
                                  <Flame size={9}/> {inc.title}
                                  <span className="ml-auto text-orange-400 font-mono">{inc.reported_at}</span>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {unassignedRoutes.length > 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Bus size={11}/> {t('operations','unassignedRoutes')} ({unassignedRoutes.length})</p>
                {unassignedRoutes.map(r => (
                  <div key={r.id} className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Bus size={10} className="text-slate-400"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-700 truncate">{r.name_th}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{r.code} · {r.trip_direction === 'inbound' ? 'เที่ยวเข้า' : r.trip_direction === 'outbound' ? 'เที่ยวออก' : '-'}</p>
                    </div>
                    <select className="text-[9px] border border-slate-200 rounded-lg px-1.5 py-1 bg-white outline-none text-slate-500 flex-shrink-0 focus:border-indigo-400" defaultValue="" onChange={e=>{ if(e.target.value) addRouteToGroup(r.id,e.target.value) }}>
                      <option value="" disabled>{t('operations','addToGroup')}</option>
                      {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: SCAN LOG ═══════════════════════ */}
      {activeTab === 'scanlog' && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {(['all','ok','not_reserved','duplicate'] as const).map(f => {
                const labels = { all:t('operations','scanAll'), ok:t('operations','scanOk'), not_reserved:t('operations','scanNoReserve'), duplicate:t('operations','scanDuplicate') }
                const cls    = { all:'', ok:'text-emerald-700', not_reserved:'text-amber-700', duplicate:'text-red-700' }
                return (
                  <button key={f} onClick={() => setScanFilter(f)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', scanFilter===f?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50', scanFilter!==f&&cls[f])}>
                    {labels[f]}
                    <span className="ml-1 text-[9px] opacity-60">{f==='all'?scanLog.length:scanLog.filter(s=>s.result===f).length}</span>
                  </button>
                )
              })}
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <input value={scanSearch} onChange={e=>setScanSearch(e.target.value)} placeholder={t('operations','scanSearch')} className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-3 py-2 outline-none focus:border-sky-400 bg-white" />
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button onClick={() => setAutoRefresh(v=>!v)} className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all', autoRefresh?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-slate-50 border-slate-200 text-slate-500')}>
              <RotateCcw size={12} className={autoRefresh?'animate-spin':''}/>
              {autoRefresh ? 'Auto refresh ON' : 'Auto refresh OFF'}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl border border-slate-200 bg-white">
              <Download size={12}/> Export
            </button>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              <div className={cn('w-2 h-2 rounded-full', autoRefresh?'bg-emerald-400 animate-pulse':'bg-slate-300')}/>
              {scanLog.length} events · {scanAnomalies} anomalies
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 flex-shrink-0">
            {[
              { label:'Board',  value:scanLog.filter(s=>s.action==='board').length,          cls:'from-sky-50 to-blue-50 border-sky-100',    vCls:'text-sky-700',     icon:<ScanLine size={14} className="text-sky-500"/> },
              { label:'Alight', value:scanLog.filter(s=>s.action==='alight').length,         cls:'from-slate-50 to-slate-50 border-slate-100', vCls:'text-slate-700',  icon:<CheckCheck size={14} className="text-slate-400"/> },
              { label:t('operations','scanNoReserve'), value:scanLog.filter(s=>s.result==='not_reserved').length, cls:'from-amber-50 to-yellow-50 border-amber-100', vCls:'text-amber-700', icon:<AlertTriangle size={14} className="text-amber-500"/> },
              { label:t('operations','scanDuplicate'), value:scanLog.filter(s=>s.result==='duplicate').length,   cls:'from-red-50 to-rose-50 border-red-100',      vCls:'text-red-700',    icon:<ShieldAlert size={14} className="text-red-500"/> },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.cls} border rounded-2xl p-3 flex items-center gap-3`}>
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">{s.icon}</div>
                <div>
                  <p className={`text-xl font-extrabold ${s.vCls}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Log table */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
            {/* Table header */}
            <div className="grid grid-cols-[100px_1fr_1fr_1fr_80px_80px] gap-x-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              <span>{t('operations','colTime')}</span><span>{t('operations','colEmployee')}</span><span>{t('operations','colPostRoute')}</span><span>{t('operations','colPickupPoint')}</span><span>{t('operations','colAction')}</span><span>{t('operations','colStatus')}</span>
            </div>
            {/* Rows */}
            <div className="overflow-y-auto flex-1">
              {filteredScans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                  <ScanLine size={24} className="mb-2"/>
                  <p className="text-sm">{t('operations','noScanItems')}</p>
                </div>
              ) : filteredScans.map((ev, i) => {
                const resultCfg = {
                  ok:           { cls:'bg-emerald-100 text-emerald-700', label:'OK' },
                  not_reserved: { cls:'bg-amber-100 text-amber-700',     label:t('operations','scanNoReserve') },
                  duplicate:    { cls:'bg-red-100 text-red-700',          label:t('operations','scanDuplicate') },
                }[ev.result]
                const isNew = i < 3 && autoRefresh
                return (
                  <div key={ev.id} className={cn(
                    'grid grid-cols-[100px_1fr_1fr_1fr_80px_80px] gap-x-4 px-4 py-2.5 text-xs border-b border-slate-50 hover:bg-slate-50/50 transition-colors items-center',
                    ev.result !== 'ok' && 'bg-amber-50/30',
                    isNew && 'animate-pulse bg-sky-50/50'
                  )}>
                    <span className="font-mono text-slate-500 text-[10px] flex items-center gap-1">
                      {isNew && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0"/>}
                      {ev.at}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 truncate">{ev.emp_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ev.emp_code}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 truncate text-[11px]">{ev.post_code}</p>
                      <p className="text-[10px] text-slate-400 truncate">{ev.route_name}</p>
                    </div>
                    <span className="text-[11px] text-slate-600 truncate">{ev.point_name}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full text-center', ev.action==='board'?'bg-sky-100 text-sky-700':'bg-slate-100 text-slate-600')}>
                      {ev.action==='board'?t('operations','board'):t('operations','alight')}
                    </span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full text-center', resultCfg.cls)}>{resultCfg.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: INCIDENTS ══════════════════════ */}
      {activeTab === 'incidents' && (
        <div className="flex-1 min-h-0 flex gap-4">
          {/* Left: list */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                {(['all','open','investigating','resolved','closed'] as const).map(f => {
                  const labels = { all:t('common','all'), open:t('operations','incOpen'), investigating:t('operations','incInvestigating'), resolved:t('operations','incResolved'), closed:t('operations','incClosed') }
                  return (
                    <button key={f} onClick={() => setIncFilter(f)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', incFilter===f?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50')}>
                      {labels[f]}
                      <span className="ml-1 text-[9px] opacity-60">{f==='all'?incidents.length:incidents.filter(i=>i.status===f).length}</span>
                    </button>
                  )
                })}
              </div>
              <div className="ml-auto">
                <Button variant="primary" size="sm" icon={<Plus size={13}/>} onClick={() => setShowIncForm(v=>!v)}>
                  {t('operations','reportIncident')}
                </Button>
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-4 gap-3 flex-shrink-0">
              {[
                { label:t('operations','incOpen'),          value:incidents.filter(i=>i.status==='open').length,          cls:'from-red-50 to-rose-50 border-red-100',       vCls:'text-red-700' },
                { label:t('operations','incInvestigating'), value:incidents.filter(i=>i.status==='investigating').length, cls:'from-amber-50 to-yellow-50 border-amber-100',  vCls:'text-amber-700' },
                { label:t('operations','incResolved'),      value:incidents.filter(i=>i.status==='resolved').length,      cls:'from-emerald-50 to-green-50 border-emerald-100',vCls:'text-emerald-700' },
                { label:t('common','all'),                  value:incidents.length,                                       cls:'from-indigo-50 to-blue-50 border-indigo-100',  vCls:'text-indigo-700' },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.cls} border rounded-2xl p-4`}>
                  <p className={`text-2xl font-extrabold ${s.vCls}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Incident cards */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-300">
                  <CheckCheck size={28} className="mb-2"/>
                  <p className="text-sm">{t('operations','noIncInCategory')}</p>
                </div>
              ) : filteredIncidents.map(inc => {
                const sev    = SEV_CFG[inc.severity]
                const typ    = INC_TYPE_CFG[inc.type]
                const status = INC_STATUS_CFG[inc.status]
                return (
                  <div key={inc.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                    {/* Row 1 */}
                    <div className="flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                        inc.severity==='critical'?'bg-red-100':inc.severity==='high'?'bg-orange-100':inc.severity==='medium'?'bg-amber-100':'bg-sky-100')}>
                        <ShieldAlert size={16} className={inc.severity==='critical'?'text-red-500':inc.severity==='high'?'text-orange-500':inc.severity==='medium'?'text-amber-500':'text-sky-500'}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold text-slate-800">{inc.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.cls}`}>{sevLabel[inc.severity]}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>{incStatusLabel[inc.status]}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">{typ.icon} {incTypeLabel[inc.type]}</span>
                          <span className="font-mono font-bold text-slate-600">{inc.post_code}</span>
                          <span>{inc.route_name}</span>
                          <span className="ml-auto font-mono">{inc.reported_at}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detail */}
                    {inc.detail && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 leading-relaxed">{inc.detail}</p>
                    )}

                    {/* Timeline */}
                    <div className="flex items-center gap-2 text-[9px] text-slate-400">
                      <div className="flex items-center gap-1"><CircleDot size={9} className="text-red-400"/> {t('operations','reportedAt')} {inc.reported_at}</div>
                      {inc.resolved_at && <>
                        <ChevronRight size={9}/>
                        <div className="flex items-center gap-1"><CheckCheck size={9} className="text-emerald-400"/> {t('operations','resolvedAt')} {inc.resolved_at}</div>
                      </>}
                    </div>

                    {/* Actions */}
                    {inc.status !== 'closed' && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {inc.status === 'open' && (
                          <button onClick={() => setIncidents(prev=>prev.map(i=>i.id===inc.id?{...i,status:'investigating'}:i))}
                            className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 hover:bg-amber-100 transition-colors">
                            {t('operations','incInvestigating')}
                          </button>
                        )}
                        {(inc.status === 'open' || inc.status === 'investigating') && (
                          <button onClick={() => resolveIncident(inc.id)}
                            className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 hover:bg-emerald-100 transition-colors">
                            {t('operations','incResolved')}
                          </button>
                        )}
                        {inc.status === 'resolved' && (
                          <button onClick={() => closeIncident(inc.id)}
                            className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-100 transition-colors">
                            {t('operations','closeInc')}
                          </button>
                        )}
                        <span className="text-[9px] text-slate-400 ml-auto">#{inc.id}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Add incident form */}
          {showIncForm && (
            <div className="w-[340px] flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 self-start sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileWarning size={15} className="text-rose-500"/> {t('operations','reportNewInc')}
                </h3>
                <button onClick={() => setShowIncForm(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
              </div>

              {/* POST */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('operations','postTrip')}</label>
                <select className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-rose-400"
                  value={incForm.post_id ?? ''}
                  onChange={e => {
                    const p = activePosts.find(p=>p.id===e.target.value)
                    setIncForm(f=>({...f, post_id:e.target.value, post_code:p?.code??'', route_name:p?.route?.name_th??''}))
                  }}>
                  <option value="">{t('operations','selectPost')}</option>
                  {activePosts.map(p => <option key={p.id} value={p.id}>{p.code} · {p.route?.name_th}</option>)}
                </select>
              </div>

              {/* Severity + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('operations','severity')}</label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['low','medium','high','critical'] as IncidentSeverity[]).map(s => (
                      <button key={s} onClick={() => setIncForm(f=>({...f,severity:s}))}
                        className={cn('text-[10px] font-bold px-2 py-1 rounded-lg border transition-all', incForm.severity===s?SEV_CFG[s].cls:'bg-white border-slate-200 text-slate-400 hover:border-slate-300')}>
                        {sevLabel[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('operations','incType')}</label>
                  <select className="w-full text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white outline-none focus:border-rose-400"
                    value={incForm.type} onChange={e => setIncForm(f=>({...f,type:e.target.value as IncidentType}))}>
                    {(Object.keys(INC_TYPE_CFG) as IncidentType[]).map(k => (
                      <option key={k} value={k}>{incTypeLabel[k]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('operations','incTitle')}</label>
                <input className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-rose-400"
                  placeholder={t('operations','incSummaryPlaceholder')}
                  value={incForm.title??''}
                  onChange={e => setIncForm(f=>({...f,title:e.target.value}))} />
              </div>

              {/* Detail */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('operations','incDetail')}</label>
                <textarea rows={3} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-rose-400 resize-none"
                  placeholder={t('operations','incDetailPlaceholder')}
                  value={incForm.detail??''}
                  onChange={e => setIncForm(f=>({...f,detail:e.target.value}))} />
              </div>

              <Button variant="primary" size="sm" onClick={submitIncident}
                className="w-full justify-center">
                {t('operations','confirmReport')}
              </Button>
            </div>
          )}
        </div>
      )}
      {/* ═══════════════════ TAB: CCTV ══════════════════════════ */}
      {activeTab === 'cctv' && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">

          {/* Province filter + search */}
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('operations','cameraPanel')}</span>
            <div className="flex items-center gap-1 flex-wrap max-h-16 overflow-y-auto flex-1">
              <button onClick={() => { setCamProvince('all'); setSelectedCam(null) }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all',
                  camProvince === 'all'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                )}>
                {t('common','all')}
              </button>
              <button onClick={() => { setCamProvince('ชลบุรี'); setSelectedCam(null) }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all',
                  camProvince === 'ชลบุรี'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                )}>
                ชลบุรี (Pattaya IOC)
              </button>
              {provinceList.map(({ display, orig }) => (
                <button key={orig} onClick={() => { setCamProvince(orig); setSelectedCam(null) }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all',
                    camProvince === orig
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                  )}>
                  {display}
                </button>
              ))}
            </div>
            <div className="relative">
              <input value={camSearch} onChange={e => { setCamSearch(e.target.value); setCamProvince('all') }}
                placeholder={t('operations','cameraSearch')} className="text-xs border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 outline-none focus:border-violet-400 bg-white w-44" />
              <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl px-3 py-1.5 flex-shrink-0">
              <Cctv size={11}/>
              {camLoading ? t('operations','cameraLoading') : `${filteredCameras.length} ${t('operations','cameraCount')}`}
            </div>
          </div>

          <div className="flex gap-4 flex-1 min-h-0">
            {camProvince === 'ชลบุรี' ? (
              <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://ioc.pattaya.go.th/live-cctv"
                  className="w-full h-full"
                  title="Pattaya IOC CCTV"
                  allow="autoplay; fullscreen"
                />
              </div>
            ) : (
              <>
                {/* Camera grid */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                  {camLoading ? (
                    <div className="grid grid-cols-4 gap-3">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                          <div className="aspect-video skeleton" />
                          <div className="p-2 space-y-1.5">
                            <div className="h-2.5 skeleton rounded w-3/4"/>
                            <div className="h-2 skeleton rounded w-1/2"/>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredCameras.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
                      <Cctv size={28}/><p className="text-sm">{t('operations','noCameraFound')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {filteredCameras.map(cam => {
                        const isSelected = selectedCam?.camid === cam.camid
                        const hasErr = camErrSet.has(cam.camid)
                        const shortTitle = cam.title.replace(/^\([^)]+\)\s*/, '').slice(0, 40)
                        const province = cam.title.match(/\(([^)]+)\)/)?.[1] ?? ''
                        return (
                          <button key={cam.camid} onClick={() => setSelectedCam(isSelected ? null : cam)}
                            className={cn(
                              'rounded-xl border overflow-hidden text-left transition-all hover:shadow-md',
                              isSelected ? 'border-violet-400 ring-2 ring-violet-300 shadow-md' : 'border-slate-200 hover:border-violet-300'
                            )}>
                            <div className="relative bg-slate-800 aspect-video overflow-hidden">
                              {hasErr ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500">
                                  <WifiOff size={16}/><span className="text-[9px]">{t('operations','offline')}</span>
                                </div>
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={`/api/cam-proxy?url=${encodeURIComponent(cam.imgurl)}&_t=${imgTs}`}
                                  alt={shortTitle}
                                  className="w-full h-full object-cover"
                                  onError={() => setCamErrSet(prev => new Set([...prev, cam.camid]))}
                                />
                              )}
                              {!hasErr && (
                                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                                  <span className="w-1 h-1 rounded-full bg-white animate-pulse"/>LIVE
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                                  <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center">
                                    <Maximize2 size={12} className="text-white"/>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="bg-white px-2 py-1.5">
                              <p className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2">{shortTitle}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 truncate">{province} · {cam.organization}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Selected camera panel */}
                {selectedCam && (() => {
                  const hasErr = camErrSet.has(selectedCam.camid)
                  const shortTitle = selectedCam.title.replace(/^\([^)]+\)\s*/, '')
                  const province   = selectedCam.title.match(/\(([^)]+)\)/)?.[1] ?? ''
                  return (
                    <div className={cn(
                      'flex-shrink-0 flex flex-col gap-3',
                      camFullscreen ? 'fixed inset-4 z-50 bg-slate-950 rounded-2xl p-4' : 'w-[420px]'
                    )}>
                      <div className="flex items-start gap-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Cctv size={14} className="text-violet-600"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-bold leading-tight', camFullscreen ? 'text-white' : 'text-slate-800')}>{shortTitle}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{province} · {selectedCam.organization}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setCamErrSet(prev => { const n = new Set(prev); n.delete(selectedCam.camid); return n })}
                            className={cn('p-1.5 rounded-lg transition-colors', camFullscreen ? 'text-slate-400 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100')} title={t('common','refresh')}>
                            <RefreshCw size={12}/>
                          </button>
                          <button onClick={() => setCamFullscreen(v => !v)}
                            className={cn('p-1.5 rounded-lg transition-colors', camFullscreen ? 'text-slate-400 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100')}>
                            <Maximize2 size={12}/>
                          </button>
                          <button onClick={() => { setSelectedCam(null); setCamFullscreen(false) }}
                            className={cn('p-1.5 rounded-lg transition-colors', camFullscreen ? 'text-slate-400 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100')}>
                            <X size={12}/>
                          </button>
                        </div>
                      </div>

                      <div className={cn('relative rounded-xl overflow-hidden bg-slate-900 flex-1', !camFullscreen && 'aspect-video')}>
                        {hasErr ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <WifiOff size={28}/>
                            <p className="text-sm font-semibold">{t('operations','cameraOffline')}</p>
                            <p className="text-xs text-slate-500 text-center px-4">{t('operations','cameraOfflineDesc')}</p>
                            <button onClick={() => setCamErrSet(prev => { const n = new Set(prev); n.delete(selectedCam.camid); return n })}
                              className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-900/30 border border-violet-700 rounded-xl px-3 py-1.5 hover:bg-violet-900/50">
                              <RefreshCw size={11}/> {t('operations','tryAgain')}
                            </button>
                          </div>
                        ) : (
                          <CameraViewer
                            cam={selectedCam}
                            onError={() => setCamErrSet(prev => new Set([...prev, selectedCam.camid]))}
                          />
                        )}
                        {!hasErr && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>LIVE
                          </div>
                        )}
                        {!hasErr && (
                          <div className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white pointer-events-none">
                            {selectedCam.hls_url ? 'HLS' : 'MJPEG'}
                          </div>
                        )}
                      </div>

                      {!camFullscreen && (
                        <div className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2 text-[10px] text-slate-500 grid grid-cols-2 gap-y-1">
                          <span className="font-semibold text-slate-600">ID:</span><span className="font-mono">{selectedCam.camid}</span>
                          <span className="font-semibold text-slate-600">Lat:</span><span className="font-mono">{parseFloat(selectedCam.latitude).toFixed(4)}</span>
                          <span className="font-semibold text-slate-600">Lon:</span><span className="font-mono">{parseFloat(selectedCam.longitude).toFixed(4)}</span>
                          <span className="font-semibold text-slate-600">Org:</span><span className="truncate">{selectedCam.organization}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Empty state */}
                {!selectedCam && !camLoading && (
                  <div className="w-[420px] flex-shrink-0 flex flex-col items-center justify-center gap-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                      <Cctv size={24} className="text-violet-300"/>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-500">{t('operations','selectCamera')}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{t('operations','selectCameraHint')}</p>
                    </div>
                    <p className="text-[10px] text-slate-400">{cameras.length} {t('operations','cameraCount')} · Longdo Traffic</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
