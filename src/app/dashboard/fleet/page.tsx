'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  Bus, Wrench, CheckCircle2, AlertCircle, Users,
  Plus, Search, Pencil, Trash2, Link2Off, Link2,
  BarChart3, Gauge, ShieldCheck, ToggleLeft, X, Check,
  TrendingUp, Fuel, ClipboardList, CalendarDays, DollarSign,
  ArrowRight, History, SendHorizonal, CircleDot, ChevronDown,
  FileText, BadgeCheck, ShieldAlert, ShieldOff, RefreshCw,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import type { Vehicle, Driver } from '@/types'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useVehiclesStore } from '@/lib/stores/useVehiclesStore';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type FleetStatus = 'active' | 'on_trip' | 'maintenance' | 'inactive'
type MaintenanceType = 'corrective' | 'preventive' | 'inspection' | 'tire' | 'oil' | 'other'
type JobStatus = 'queued' | 'in_progress' | 'done' | 'cancelled'

interface MaintenanceJob {
  id: string
  vehicleId: string
  type: MaintenanceType
  status: JobStatus
  title: string
  detail: string
  mileageIn: number
  cost: number | null
  dateIn: string
  dateOut: string | null
  techNote: string
}

interface FleetRecord {
  vehicle: Vehicle
  driver?: Driver
  status: FleetStatus
  mileage: number
  lastServiceDate: string
  nextServiceKm: number
  fuelPct: number
  insuranceExp: string
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
function seedNum(id: string, min: number, max: number) {
  let h = 5381
  for (const c of id) h = ((h << 5) + h) ^ c.charCodeAt(0)
  return min + (Math.abs(h) % (max - min + 1))
}

const STATUS_CFG: Record<FleetStatus, { label: string; bg: string; border: string; dot: string; text: string; icon: React.ReactNode }> = {
  active: { label: 'พร้อมใช้', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: '#10b981', text: 'text-emerald-700', icon: <CheckCircle2 size={11} /> },
  on_trip: { label: 'ออกวิ่ง', bg: 'bg-sky-50', border: 'border-sky-200', dot: '#0ea5e9', text: 'text-sky-700', icon: <Bus size={11} /> },
  maintenance: { label: 'ซ่อมบำรุง', bg: 'bg-amber-50', border: 'border-amber-200', dot: '#f59e0b', text: 'text-amber-700', icon: <Wrench size={11} /> },
  inactive: { label: 'ไม่ใช้งาน', bg: 'bg-slate-50', border: 'border-slate-200', dot: '#94a3b8', text: 'text-slate-500', icon: <ToggleLeft size={11} /> },
}

const JOB_STATUS_CFG: Record<JobStatus, { label: string; color: string; bg: string; border: string }> = {
  queued: { label: 'รอดำเนินการ', color: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200' },
  done: { label: 'เสร็จแล้ว', color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  cancelled: { label: 'ยกเลิก', color: '#94a3b8', bg: 'bg-slate-50', border: 'border-slate-200' },
}

const MAINT_TYPES: Record<MaintenanceType, { label: string; icon: string; color: string }> = {
  corrective: { label: 'ซ่อมแก้ไข', icon: '🔧', color: '#ef4444' },
  preventive: { label: 'บำรุงรักษา', icon: '🛡️', color: '#10b981' },
  inspection: { label: 'ตรวจสภาพ', icon: '🔍', color: '#3b82f6' },
  tire: { label: 'ยาง/ล้อ', icon: '🛞', color: '#8b5cf6' },
  oil: { label: 'เปลี่ยนน้ำมัน', icon: '🛢️', color: '#f59e0b' },
  other: { label: 'อื่น ๆ', icon: '📋', color: '#64748b' },
}

// seed mock jobs
function buildMockJobs(vehicles: Vehicle[], fleetRecords: FleetRecord[]): MaintenanceJob[] {
  const jobs: MaintenanceJob[] = []
  const types: MaintenanceType[] = ['corrective', 'preventive', 'inspection', 'oil', 'tire']
  const statuses: JobStatus[] = ['done', 'done', 'queued', 'in_progress']
  vehicles.forEach((v, vi) => {
    const rec = fleetRecords.find(r => r.vehicle.id === v.id)
    const base = seedNum(v.id, 0, 100)
    const count = 1 + (base % 3)
    for (let i = 0; i < count; i++) {
      const isRecent = i === 0
      const st: JobStatus = isRecent && rec?.status === 'maintenance' ? 'in_progress' : statuses[(base + i) % statuses.length]
      jobs.push({
        id: `job-${v.id}-${i}`,
        vehicleId: v.id,
        type: types[(base + i) % types.length],
        status: st,
        title: ['เปลี่ยนยาง', 'เปลี่ยนน้ำมันเครื่อง', 'ตรวจเช็คระยะ', 'ซ่อมเบรก', 'เปลี่ยนกรองอากาศ', 'ตรวจสภาพรถ'][(base + i) % 6],
        detail: ['ยางสึกหรอ', 'ถึงรอบ 10,000 km', 'ตรวจก่อนฤดูฝน', 'เบรกมีเสียงดัง', 'กรองอุดตัน', 'ตรวจประจำปี'][(base + i) % 6],
        mileageIn: rec ? rec.mileage - seedNum(v.id + i, 100, 5000) : 50000,
        cost: st === 'done' ? seedNum(v.id + i + 'c', 500, 15000) : null,
        dateIn: `2026-0${3 + (vi % 2)}-${String(1 + seedNum(v.id + i, 0, 27)).padStart(2, '0')}`,
        dateOut: st === 'done' ? `2026-0${3 + (vi % 2)}-${String(5 + seedNum(v.id + i, 0, 20)).padStart(2, '0')}` : null,
        techNote: st === 'done' ? 'ดำเนินการเรียบร้อย' : '',
      })
    }
  })
  return jobs
}

const INSURANCE_COMPANIES = ['วิริยะประกันภัย', 'เทเวศประกันภัย', 'กรุงเทพประกันภัย', 'ทิพยประกันภัย', 'อลิอันซ์ประกันภัย']
const PRB_COMPANIES = ['บ.กลางคุ้มครองผู้ประสบภัยจากรถ', 'คปภ.', 'กองทุนทดแทนผู้ประสบภัย']
const INS_CLASSES: InsClass[] = ['ชั้น 1', 'ชั้น 2+', 'ชั้น 3+', 'ชั้น 3']

function buildMockInsurance(vehicles: Vehicle[]): InsurancePolicy[] {
  const policies: InsurancePolicy[] = []
  const today = new Date()
  vehicles.forEach(v => {
    const n = seedNum(v.id, 0, 99)
    // ประกันภัย
    const insExpOffset = seedNum(v.id + 'ie', -60, 400) // days from today
    const insExpDate = new Date(today); insExpDate.setDate(insExpDate.getDate() + insExpOffset)
    const insStartDate = new Date(insExpDate); insStartDate.setFullYear(insStartDate.getFullYear() - 1)
    const insStatus: InsStatus = insExpOffset < 0 ? 'expired' : insExpOffset < 30 ? 'expiring' : 'active'
    policies.push({
      id: `ins-${v.id}`,
      vehicleId: v.id,
      insType: 'ประกันภัย',
      insClass: INS_CLASSES[n % INS_CLASSES.length],
      policyNo: `POL-${String(n * 1000 + seedNum(v.id + 'pn', 100, 999)).padStart(8, '0')}`,
      company: INSURANCE_COMPANIES[n % INSURANCE_COMPANIES.length],
      startDate: insStartDate.toISOString().slice(0, 10),
      expireDate: insExpDate.toISOString().slice(0, 10),
      premium: seedNum(v.id + 'pr', 8000, 45000),
      coverageMax: [300000, 500000, 1000000, 2000000, 3000000][n % 5],
      status: insStatus,
    })
    // พรบ
    const prbExpOffset = seedNum(v.id + 'pe', -30, 370)
    const prbExpDate = new Date(today); prbExpDate.setDate(prbExpDate.getDate() + prbExpOffset)
    const prbStartDate = new Date(prbExpDate); prbStartDate.setFullYear(prbStartDate.getFullYear() - 1)
    const prbStatus: InsStatus = prbExpOffset < 0 ? 'expired' : prbExpOffset < 30 ? 'expiring' : 'active'
    policies.push({
      id: `prb-${v.id}`,
      vehicleId: v.id,
      insType: 'พรบ',
      insClass: '-',
      policyNo: `PRB-${String(seedNum(v.id + 'prbn', 10000, 99999))}`,
      company: PRB_COMPANIES[n % PRB_COMPANIES.length],
      startDate: prbStartDate.toISOString().slice(0, 10),
      expireDate: prbExpDate.toISOString().slice(0, 10),
      premium: seedNum(v.id + 'prbpr', 600, 1500),
      coverageMax: 300000,
      status: prbStatus,
    })
  })
  return policies
}

// ═══════════════════════════════════════════════════════════════
// SEND TO MAINTENANCE MODAL
// ═══════════════════════════════════════════════════════════════
function SendMaintenanceModal({
  vehicle, currentMileage, onClose, onSubmit,
}: {
  vehicle: Vehicle
  currentMileage: number
  onClose: () => void
  onSubmit: (job: Omit<MaintenanceJob, 'id'>) => void
}) {
  const { t } = useLang()
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState<MaintenanceType>('preventive')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [dateIn, setDateIn] = useState(today)
  const [mileage, setMileage] = useState(String(currentMileage))

  const maintLabels: Record<MaintenanceType, string> = {
    corrective: t('fleet', 'maintCorrective'),
    preventive: t('fleet', 'maintPreventive'),
    inspection: t('fleet', 'maintInspection'),
    tire: t('fleet', 'maintTire'),
    oil: t('fleet', 'maintOil'),
    other: t('fleet', 'maintOther'),
  }

  const submit = () => {
    if (!title.trim()) return
    onSubmit({
      vehicleId: vehicle.id, type, status: 'queued',
      title: title.trim(), detail: detail.trim(),
      mileageIn: parseInt(mileage) || currentMileage,
      cost: null, dateIn, dateOut: null, techNote: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[440px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-bold text-slate-800">{t('fleet', 'sendMaint')}</p>
            <p className="text-[10px] font-mono text-slate-400">{vehicle.license} · {vehicle.vehicle_type?.name_th}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={14} /></button>
        </div>

        <div className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">{t('fleet', 'workType')} *</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MAINT_TYPES) as MaintenanceType[]).map(tp => {
                const mt = MAINT_TYPES[tp]
                return (
                  <button key={tp} onClick={() => setType(tp)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${type === tp ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    style={{ background: type === tp ? mt.color : undefined }}>
                    <span>{mt.icon}</span>{maintLabels[tp]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('fleet', 'workTitle')} *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t('fleet', 'workTitlePlaceholder')}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </div>

          {/* Detail */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('fleet', 'workDetail')}</label>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2}
              placeholder={t('fleet', 'workDetailPlaceholder')}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400 resize-none" />
          </div>

          {/* Date + Mileage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('fleet', 'dateIn')}</label>
              <input type="date" value={dateIn} onChange={e => setDateIn(e.target.value)}
                className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('fleet', 'mileageLabel')}</label>
              <input type="number" value={mileage} onChange={e => setMileage(e.target.value)}
                className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-mono" />
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3">
            <Wrench size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 leading-relaxed">
              {t('fleet', 'sendMaintHint').replace('{status}', t('fleet', 'statusMaint')).split('\n').map((line, i) => (
                <span key={i}>{i > 0 && <br />}{line}</span>
              ))}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50">{t('common', 'cancel')}</button>
          <button onClick={submit} disabled={!title.trim()}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white rounded-xl py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 transition-colors shadow-md shadow-amber-200">
            <SendHorizonal size={14} /> {t('fleet', 'sendMaint')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CLOSE JOB MODAL (mark done + fill cost)
// ═══════════════════════════════════════════════════════════════
function CloseJobModal({
  job, vehicle, onClose, onClose2: onDone,
}: {
  job: MaintenanceJob; vehicle?: Vehicle
  onClose: () => void
  onClose2: (id: string, cost: number, note: string, dateOut: string) => void
}) {
  const { t } = useLang()
  const today = new Date().toISOString().slice(0, 10)
  const [cost, setCost] = useState('')
  const [note, setNote] = useState('')
  const [dateOut, setDateOut] = useState(today)
  const mt = MAINT_TYPES[job.type]
  const maintLabel: Record<MaintenanceType, string> = {
    corrective: t('fleet', 'maintCorrective'), preventive: t('fleet', 'maintPreventive'),
    inspection: t('fleet', 'maintInspection'), tire: t('fleet', 'maintTire'),
    oil: t('fleet', 'maintOil'), other: t('fleet', 'maintOther'),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-800">{t('fleet', 'closeJob')}</p>
            <p className="text-[10px] text-slate-400">{vehicle?.license} · {job.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={14} /></button>
        </div>

        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4" style={{ background: `${mt.color}15`, border: `1px solid ${mt.color}30` }}>
          <span className="text-base">{mt.icon}</span>
          <div>
            <p className="text-xs font-bold text-slate-700">{job.title}</p>
            <p className="text-[10px] text-slate-500">{maintLabel[job.type]} · In: {job.dateIn}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('fleet', 'dateOut')}</label>
            <input type="date" value={dateOut} onChange={e => setDateOut(e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('fleet', 'costLabel')}</label>
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0"
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('fleet', 'techNote')}</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Summary of work done, parts replaced..."
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 resize-none" />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50">{t('common', 'cancel')}</button>
          <button onClick={() => { onDone(job.id, parseFloat(cost) || 0, note, dateOut); onClose() }}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white rounded-xl py-2.5 bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200">
            <CheckCircle2 size={14} /> {t('fleet', 'returnVehicle')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// JOB CARD
// ═══════════════════════════════════════════════════════════════
function JobCard({
  job, vehicle, onUpdateStatus, onClose,
}: {
  job: MaintenanceJob; vehicle?: Vehicle
  onUpdateStatus: (id: string, status: JobStatus) => void
  onClose: (job: MaintenanceJob) => void
}) {
  const { t } = useLang()
  const mt = MAINT_TYPES[job.type]
  const jst = JOB_STATUS_CFG[job.status]
  const [menuOpen, setMenuOpen] = useState(false)

  const jobStatusLabel: Record<JobStatus, string> = {
    queued: t('fleet', 'jobQueued'),
    in_progress: t('fleet', 'jobInProgress'),
    done: t('fleet', 'jobDone'),
    cancelled: t('fleet', 'jobCancelled'),
  }
  const maintLabel: Record<MaintenanceType, string> = {
    corrective: t('fleet', 'maintCorrective'),
    preventive: t('fleet', 'maintPreventive'),
    inspection: t('fleet', 'maintInspection'),
    tire: t('fleet', 'maintTire'),
    oil: t('fleet', 'maintOil'),
    other: t('fleet', 'maintOther'),
  }

  return (
    <div className={`bg-white rounded-xl border shadow-card hover:shadow-card-hover transition-all overflow-hidden`}
      style={{ borderLeftWidth: 3, borderLeftColor: mt.color }}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base flex-shrink-0">{mt.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{job.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{maintLabel[job.type]}</p>
            </div>
          </div>

          {/* Status dropdown */}
          <div className="relative flex-shrink-0">
            <button onClick={() => setMenuOpen(o => !o)}
              className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border ${jst.bg} ${jst.border} transition-colors`}
              style={{ color: jst.color }}>
              <CircleDot size={8} /> {jobStatusLabel[job.status]} <ChevronDown size={8} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-36">
                {(Object.keys(JOB_STATUS_CFG) as JobStatus[]).map(s => (
                  <button key={s} onClick={() => { onUpdateStatus(job.id, s); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50">
                    <span style={{ color: JOB_STATUS_CFG[s].color }}>●</span>
                    {jobStatusLabel[s]}
                    {s === job.status && <Check size={9} className="ml-auto text-slate-300" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vehicle */}
        {vehicle && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Bus size={10} className="text-slate-500" />
            </div>
            <span className="text-[10px] font-bold font-mono text-slate-600">{vehicle.license}</span>
            <span className="text-[9px] text-slate-400">{vehicle.vehicle_type?.name_th}</span>
          </div>
        )}

        {/* Detail */}
        {job.detail && <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">{job.detail}</p>}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[9px] text-slate-400 mb-3">
          <span className="flex items-center gap-1"><CalendarDays size={9} /> {job.dateIn}</span>
          <span className="flex items-center gap-1"><Gauge size={9} /> {job.mileageIn.toLocaleString()} km</span>
          {job.cost != null && (
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <DollarSign size={9} /> {job.cost.toLocaleString()} ฿
            </span>
          )}
          {job.dateOut && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={9} /> {job.dateOut}</span>}
        </div>

        {/* Tech note */}
        {job.techNote && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 mb-2">
            <p className="text-[9px] text-slate-500 font-semibold">📝 {job.techNote}</p>
          </div>
        )}

        {/* Action */}
        {(job.status === 'queued' || job.status === 'in_progress') && (
          <button onClick={() => onClose(job)}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors mt-1">
            <CheckCircle2 size={11} /> {t('fleet', 'closeJob')}
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
type PageTab = 'fleet' | 'maintenance' | 'insurance'

type InsType = 'ประกันภัย' | 'พรบ'
type InsClass = 'ชั้น 1' | 'ชั้น 2+' | 'ชั้น 3+' | 'ชั้น 3' | '-'
type InsStatus = 'active' | 'expiring' | 'expired'

interface InsurancePolicy {
  id: string
  vehicleId: string
  insType: InsType
  insClass: InsClass
  policyNo: string
  company: string
  startDate: string
  expireDate: string
  premium: number
  coverageMax: number
  status: InsStatus
}

export default function FleetPage() {
  const { openModal } = useStore()
  const { drivers, driverVehicles, unassignDriverVehicle, } = useDriverStore()
  const { vehicles, vehicleTypes, loadVehicles, loadVehicleTypes } = useVehiclesStore()
  const { t } = useLang()

  useEffect(() => { loadVehicles(); loadVehicleTypes() }, [loadVehicles, loadVehicleTypes])

  // ── Computed translation maps ─────────────────────────────────
  const statusLabel: Record<FleetStatus, string> = {
    active: t('fleet', 'statusActive'),
    on_trip: t('fleet', 'statusOnTrip'),
    maintenance: t('fleet', 'statusMaint'),
    inactive: t('fleet', 'statusInactive'),
  }
  const jobStatusLabel: Record<JobStatus, string> = {
    queued: t('fleet', 'jobQueued'),
    in_progress: t('fleet', 'jobInProgress'),
    done: t('fleet', 'jobDone'),
    cancelled: t('fleet', 'jobCancelled'),
  }
  const maintLabel: Record<MaintenanceType, string> = {
    corrective: t('fleet', 'maintCorrective'),
    preventive: t('fleet', 'maintPreventive'),
    inspection: t('fleet', 'maintInspection'),
    tire: t('fleet', 'maintTire'),
    oil: t('fleet', 'maintOil'),
    other: t('fleet', 'maintOther'),
  }
  const insTypeLabel: Record<InsType, string> = {
    'ประกันภัย': t('fleet', 'insTypeIns'),
    'พรบ': t('fleet', 'insTypePrb'),
  }

  // ── Fleet status map ─────────────────────────────────────────
  const [statusMap, setStatusMap] = useState<Record<string, FleetStatus>>(() => {
    const m: Record<string, FleetStatus> = {}
    for (const v of vehicles) {
      const n = seedNum(v.id, 0, 9)
      m[v.id] = v.is_status === 'inactive' ? 'inactive' : n <= 2 ? 'on_trip' : n === 3 ? 'maintenance' : 'active'
    }
    return m
  })

  // ── Driver lookup ─────────────────────────────────────────────
  const vehicleDriverMap = useMemo(() => {
    const map = new Map<string, Driver>()
    for (const dv of driverVehicles) {
      const drv = drivers.find(d => d.id === dv.driver_id)
      if (drv) map.set(dv.vehicle_id, drv)
    }
    return map
  }, [driverVehicles, drivers])

  const assignedDriverIds = new Set(driverVehicles.map(dv => dv.driver_id))
  const freeDrivers = drivers.filter(d => d.is_status === 'active' && !assignedDriverIds.has(d.id))

  // ── Fleet records ─────────────────────────────────────────────
  const fleet: FleetRecord[] = useMemo(() => vehicles.map(v => ({
    vehicle: v,
    driver: vehicleDriverMap.get(v.id),
    status: statusMap[v.id] ?? 'active',
    mileage: seedNum(v.id + 'm', 15000, 180000),
    lastServiceDate: `${2025 + seedNum(v.id + 'ls', 0, 1)}-${String(seedNum(v.id + 'lsm', 1, 12)).padStart(2, '0')}-${String(seedNum(v.id + 'lsd', 1, 28)).padStart(2, '0')}`,
    nextServiceKm: seedNum(v.id + 'ns', 500, 9800),
    fuelPct: seedNum(v.id + 'f', 10, 100),
    insuranceExp: `${2025 + seedNum(v.id + 'ie', 0, 2)}-${String(seedNum(v.id + 'iem', 1, 12)).padStart(2, '0')}-${String(seedNum(v.id + 'ied', 1, 28)).padStart(2, '0')}`,
  })), [vehicles, vehicleDriverMap, statusMap])

  // ── Maintenance jobs ──────────────────────────────────────────
  const [jobs, setJobs] = useState<MaintenanceJob[]>(() => buildMockJobs(vehicles, fleet))

  const updateJobStatus = (id: string, status: JobStatus) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
    // if all jobs for a vehicle are done, set vehicle back to active
    if (status === 'done' || status === 'cancelled') {
      const job = jobs.find(j => j.id === id)!
      const remaining = jobs.filter(j => j.vehicleId === job.vehicleId && j.id !== id && (j.status === 'queued' || j.status === 'in_progress'))
      if (remaining.length === 0) setStatusMap(prev => ({ ...prev, [job.vehicleId]: 'active' }))
    }
  }

  const closeJob = (jobId: string, cost: number, note: string, dateOut: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'done', cost, techNote: note, dateOut } : j))
    const job = jobs.find(j => j.id === jobId)!
    const remaining = jobs.filter(j => j.vehicleId === job.vehicleId && j.id !== jobId && (j.status === 'queued' || j.status === 'in_progress'))
    if (remaining.length === 0) setStatusMap(prev => ({ ...prev, [job.vehicleId]: 'active' }))
  }

  const addJob = (data: Omit<MaintenanceJob, 'id'>) => {
    const newJob: MaintenanceJob = { ...data, id: `job-${Date.now()}` }
    setJobs(prev => [newJob, ...prev])
    setStatusMap(prev => ({ ...prev, [data.vehicleId]: 'maintenance' }))
  }

  // ── Insurance ─────────────────────────────────────────────────
  const [insTypeFilter, setInsTypeFilter] = useState<InsType | 'all'>('all')
  const [insStatusFilter, setInsStatusFilter] = useState<InsStatus | 'all'>('all')
  const [policies] = useState<InsurancePolicy[]>(() => buildMockInsurance(vehicles))

  // ── UI state ──────────────────────────────────────────────────
  const [tab, setTab] = useState<PageTab>('fleet')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<FleetStatus | 'all'>('all')
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sendTarget, setSendTarget] = useState<FleetRecord | null>(null)
  const [closeTarget, setCloseTarget] = useState<MaintenanceJob | null>(null)
  const [assignTarget, setAssignTarget] = useState<Vehicle | null>(null)

  // ── Stats ─────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<FleetStatus, number> = { active: 0, on_trip: 0, maintenance: 0, inactive: 0 }
    fleet.forEach(r => c[r.status]++)
    return c
  }, [fleet])

  const jobCounts = useMemo(() => {
    const c: Record<JobStatus, number> = { queued: 0, in_progress: 0, done: 0, cancelled: 0 }
    jobs.forEach(j => c[j.status]++)
    return c
  }, [jobs])

  const insCounts = useMemo(() => ({
    active: policies.filter(p => p.status === 'active').length,
    expiring: policies.filter(p => p.status === 'expiring').length,
    expired: policies.filter(p => p.status === 'expired').length,
    prb_expiring: policies.filter(p => p.insType === 'พรบ' && (p.status === 'expiring' || p.status === 'expired')).length,
  }), [policies])

  const filteredPolicies = useMemo(() => {
    let list = policies
    if (insTypeFilter !== 'all') list = list.filter(p => p.insType === insTypeFilter)
    if (insStatusFilter !== 'all') list = list.filter(p => p.status === insStatusFilter)
    return list
  }, [policies, insTypeFilter, insStatusFilter])

  const totalCostDone = jobs.filter(j => j.status === 'done' && j.cost).reduce((s, j) => s + (j.cost ?? 0), 0)
  const utilPct = fleet.length ? Math.round((counts.active + counts.on_trip) / fleet.length * 100) : 0
  const mainWarnCount = fleet.filter(r => r.nextServiceKm < 2000).length
  const insWarnCount = fleet.filter(r => Math.round((new Date(r.insuranceExp).getTime() - Date.now()) / 86400000) < 30).length

  // ── Filtered lists ────────────────────────────────────────────
  const filteredFleet = fleet.filter(r => {
    const q = `${r.vehicle.license} ${r.vehicle.code}`.toLowerCase()
    return q.includes(search.toLowerCase())
      && (!typeFilter || r.vehicle.vehicle_type_id === typeFilter)
      && (statusFilter === 'all' || r.status === statusFilter)
  })

  const filteredJobs = jobs.filter(j =>
    (jobStatusFilter === 'all' || j.status === jobStatusFilter) &&
    (!search || vehicles.find(v => v.id === j.vehicleId)?.license.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    const order: Record<JobStatus, number> = { in_progress: 0, queued: 1, done: 2, cancelled: 3 }
    return order[a.status] - order[b.status]
  })

  const changeStatus = (v: Vehicle, s: FleetStatus) => setStatusMap(prev => ({ ...prev, [v.id]: s }))

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Modals ─────────────────────────────────────────── */}
      {sendTarget && (
        <SendMaintenanceModal
          vehicle={sendTarget.vehicle} currentMileage={sendTarget.mileage}
          onClose={() => setSendTarget(null)} onSubmit={addJob}
        />
      )}
      {closeTarget && (
        <CloseJobModal
          job={closeTarget}
          vehicle={vehicles.find(v => v.id === closeTarget.vehicleId)}
          onClose={() => setCloseTarget(null)}
          onClose2={closeJob}
        />
      )}
      {assignTarget && (
        <AssignModal
          vehicle={assignTarget} freeDrivers={freeDrivers}
          onClose={() => setAssignTarget(null)}
          onAssign={driverId => openModal('assign-driver-vehicle', drivers.find(d => d.id === driverId))}
        />
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Bus size={14} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Fleet Management</h1>
          </div>
          <p className="text-xs text-slate-400">{t('fleet', 'subtitle')} · {fleet.length} {t('common', 'items')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('insurance')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border transition-colors ${tab === 'insurance' ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200' : 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}>
            <ShieldCheck size={13} /> {t('fleet', 'insTab')}
            {(insCounts.expiring + insCounts.expired) > 0 && (
              <span className={`text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ${tab === 'insurance' ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                {insCounts.expiring + insCounts.expired}
              </span>
            )}
          </button>
          <button onClick={() => { setTab('maintenance') }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border transition-colors ${tab === 'maintenance' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200' : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'}`}>
            <Wrench size={13} /> {t('fleet', 'maintenance')}
            {(jobCounts.queued + jobCounts.in_progress) > 0 && (
              <span className={`text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ${tab === 'maintenance' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}>
                {jobCounts.queued + jobCounts.in_progress}
              </span>
            )}
          </button>
          <button onClick={() => openModal('add-vehicle')}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-200 transition-colors">
            <Plus size={13} /> {t('fleet', 'addVehicle')}
          </button>
        </div>
      </div>

      {/* ── KPI row ────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {/* Utilization */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fleet Utilization</p>
          <div className="flex items-end gap-2 mt-2">
            <p className="text-3xl font-black text-slate-800">{utilPct}%</p>
            <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold mb-0.5"><TrendingUp size={10} /></span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${utilPct}%` }} />
          </div>
          <p className="text-[9px] text-slate-400 mt-1">{counts.active + counts.on_trip} / {fleet.length} {t('fleet', 'vehicleCount')}</p>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('fleet', 'fleetStatus')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STATUS_CFG) as FleetStatus[]).map(s => {
              const cfg = STATUS_CFG[s]
              return (
                <button key={s} onClick={() => { setStatusFilter(prev => prev === s ? 'all' : s); setTab('fleet') }}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 border transition-all text-left ${statusFilter === s && tab === 'fleet' ? `${cfg.bg} ${cfg.border}` : 'border-slate-100 bg-slate-50 hover:bg-white'}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                  <div>
                    <p className="text-[9px] font-bold text-slate-600">{statusLabel[s]}</p>
                    <p className="text-sm font-black" style={{ color: cfg.dot }}>{counts[s]}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Maintenance jobs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('fleet', 'maintJobs')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(JOB_STATUS_CFG) as JobStatus[]).map(s => {
              const jcfg = JOB_STATUS_CFG[s]
              return (
                <button key={s} onClick={() => { setJobStatusFilter(prev => prev === s ? 'all' : s); setTab('maintenance') }}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 border transition-all text-left ${jobStatusFilter === s && tab === 'maintenance' ? `${jcfg.bg} ${jcfg.border}` : 'border-slate-100 bg-slate-50 hover:bg-white'}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: jcfg.color }} />
                  <div>
                    <p className="text-[9px] font-bold text-slate-600">{jobStatusLabel[s]}</p>
                    <p className="text-sm font-black" style={{ color: jcfg.color }}>{jobCounts[s]}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Alerts + cost */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('fleet', 'alertsAndCost')}</p>
          <div className={`flex items-center gap-2 rounded-xl p-2.5 ${mainWarnCount > 0 ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
            <Wrench size={12} className={mainWarnCount > 0 ? 'text-red-500' : 'text-slate-400'} />
            <div><p className="text-[9px] font-bold text-slate-600">{t('fleet', 'serviceWarn')}</p><p className={`text-sm font-black ${mainWarnCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{mainWarnCount} {t('fleet', 'vehicleCount')}</p></div>
          </div>
          <div className={`flex items-center gap-2 rounded-xl p-2.5 ${insWarnCount > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100'}`}>
            <ShieldCheck size={12} className={insWarnCount > 0 ? 'text-amber-500' : 'text-slate-400'} />
            <div><p className="text-[9px] font-bold text-slate-600">{t('fleet', 'insWarn')}</p><p className={`text-sm font-black ${insWarnCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{insWarnCount} {t('fleet', 'vehicleCount')}</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-xl p-2.5 bg-emerald-50 border border-emerald-100">
            <DollarSign size={12} className="text-emerald-500" />
            <div><p className="text-[9px] font-bold text-slate-600">{t('fleet', 'totalCost')}</p><p className="text-sm font-black text-emerald-600">{totalCostDone.toLocaleString()} ฿</p></div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {([['fleet', t('fleet', 'fleetTab')], ['insurance', t('fleet', 'insTabLabel')], ['maintenance', t('fleet', 'maintTabLabel')]] as [PageTab, string][]).map(([tabKey, label]) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${tab === tabKey ? 'border-sky-500 text-sky-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {label}
            {tabKey === 'maintenance' && (jobCounts.queued + jobCounts.in_progress) > 0 && (
              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{jobCounts.queued + jobCounts.in_progress}</span>
            )}
          </button>
        ))}

        {/* Search + controls right-aligned */}
        <div className="ml-auto flex items-center gap-2 mb-1">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search size={11} className="text-slate-400 flex-shrink-0" />
            <input className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-36"
              placeholder={t('fleet', 'searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {tab === 'fleet' && (
            <div className="flex gap-0.5 bg-slate-100 rounded-xl p-1">
              {(['grid', 'table'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${viewMode === v ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>
                  {v === 'grid' ? '⊞' : '≡'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FLEET TAB                                            */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'fleet' && (
        <>
          {/* Type pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => setTypeFilter('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${!typeFilter ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              {t('fleet', 'allTypes')} ({fleet.length})
            </button>
            {vehicleTypes.filter(vt => vt.is_status === 'active').map(vt => (
              <button key={vt.id} onClick={() => setTypeFilter(prev => prev === vt.id ? '' : vt.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${typeFilter === vt.id ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                <Bus size={11} /> {vt.name_th} ×{fleet.filter(r => r.vehicle.vehicle_type_id === vt.id).length}
              </button>
            ))}
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredFleet.map(r => {
                const cfg = STATUS_CFG[r.status]
                const daysIns = Math.round((new Date(r.insuranceExp).getTime() - Date.now()) / 86400000)
                const insWarn = daysIns < 30
                const serviceWarn = r.nextServiceKm < 2000
                return (
                  <div key={r.vehicle.id} className={`bg-white rounded-2xl border ${cfg.border} shadow-card hover:shadow-card-hover transition-all overflow-hidden`}>
                    <div className="h-1" style={{ background: cfg.dot }} />
                    <div className="p-4">
                      {/* Head */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                            <Bus size={18} style={{ color: cfg.dot }} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm font-mono">{r.vehicle.license}</p>
                            <p className="text-[10px] text-slate-400">{r.vehicle.code} · {r.vehicle.vehicle_type?.name_th}</p>
                          </div>
                        </div>
                        {/* Status dropdown */}
                        <StatusDropdown status={r.status} onChange={s => changeStatus(r.vehicle, s)} />
                      </div>

                      {/* Fuel + capacity */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Users size={10} /> {r.vehicle.capacity ?? '-'} {t('fleet', 'seats')}</span>
                        <FuelBar pct={r.fuelPct} />
                      </div>

                      {/* Gauges */}
                      <div className="space-y-1.5 mb-3">
                        <MiniGauge label="Mileage" value={r.mileage} max={300000} unit="km" color="#6366f1" />
                        <MiniGauge label={t('fleet', 'serviceRemaining')} value={r.nextServiceKm} max={10000} unit="km" color={serviceWarn ? '#ef4444' : '#10b981'} warn={serviceWarn} />
                      </div>

                      {/* Driver */}
                      {r.driver ? (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2 mb-3">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">{r.driver.first_name_th.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-slate-700 truncate">{r.driver.first_name_th} {r.driver.last_name_th}</p>
                            <p className="text-[9px] font-mono text-slate-400">{r.driver.code}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-dashed border-slate-200 px-2.5 py-2 mb-3">
                          <AlertCircle size={10} className="text-slate-400" /><p className="text-[10px] text-slate-400">{t('fleet', 'noDriver')}</p>
                        </div>
                      )}

                      {/* Warnings */}
                      {(serviceWarn || insWarn) && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {serviceWarn && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold border border-red-200 flex items-center gap-0.5"><Wrench size={7} /> {t('fleet', 'serviceWarnBadge')}</span>}
                          {insWarn && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold border border-amber-200 flex items-center gap-0.5"><ShieldCheck size={7} /> {t('fleet', 'insWarnBadge')} {daysIns} {t('fleet', 'days')}</span>}
                        </div>
                      )}

                      {/* Footer actions */}
                      <div className="flex items-center gap-1 pt-2.5 border-t border-slate-100">
                        <button onClick={() => setSendTarget(r)}
                          className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">
                          <Wrench size={10} /> {t('fleet', 'sendMaint')}
                        </button>
                        <div className="flex-1" />
                        {r.driver
                          ? <button onClick={() => unassignDriverVehicle(r.vehicle.id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg" title={t('fleet', 'removeDriver')}><Link2Off size={12} /></button>
                          : <button onClick={() => setAssignTarget(r.vehicle)} className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg" title={t('fleet', 'assignDriver')}><Link2 size={12} /></button>}
                        <button className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg"><Pencil size={12} /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredFleet.length === 0 && <div className="col-span-full text-center py-16 text-slate-400 text-xs"><Bus size={32} className="mx-auto mb-3 text-slate-200" /> {t('fleet', 'noVehicles')}</div>}
            </div>
          ) : (
            /* Table view */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  {[t('fleet', 'plate'), t('fleet', 'vehicleType'), t('common', 'status'), t('common', 'driver'), 'Mileage', t('fleet', 'serviceRemaining'), 'Fuel', t('fleet', 'insUntil'), t('fleet', 'manage')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredFleet.map(r => {
                    const cfg = STATUS_CFG[r.status]
                    const daysIns = Math.round((new Date(r.insuranceExp).getTime() - Date.now()) / 86400000)
                    return (
                      <tr key={r.vehicle.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3"><p className="font-bold font-mono text-slate-800">{r.vehicle.license}</p><p className="text-[9px] text-slate-400">{r.vehicle.code}</p></td>
                        <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">{r.vehicle.vehicle_type?.name_th}</span></td>
                        <td className="px-4 py-3"><span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full w-fit ${cfg.bg} border ${cfg.border}`} style={{ color: cfg.dot }}>{cfg.icon}{cfg.label}</span></td>
                        <td className="px-4 py-3">{r.driver ? <span className="text-xs text-slate-700">{r.driver.first_name_th} {r.driver.last_name_th}</span> : <span className="text-[10px] text-slate-400">— {t('fleet', 'vacant')}</span>}</td>
                        <td className="px-4 py-3"><span className="text-xs font-mono text-slate-600">{r.mileage.toLocaleString()}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold ${r.nextServiceKm < 2000 ? 'text-red-500' : 'text-slate-600'}`}>{r.nextServiceKm.toLocaleString()} km</span></td>
                        <td className="px-4 py-3"><FuelBar pct={r.fuelPct} /></td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-semibold ${daysIns < 30 ? 'text-amber-500' : 'text-slate-500'}`}>{r.insuranceExp}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setSendTarget(r)} className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"><Wrench size={10} /> {t('fleet', 'sendMaint')}</button>
                            {r.driver ? <button onClick={() => unassignDriverVehicle(r.vehicle.id)} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg"><Link2Off size={12} /></button>
                              : <button onClick={() => setAssignTarget(r.vehicle)} className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg"><Link2 size={12} /></button>}
                            <button className="p-1 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg"><Pencil size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MAINTENANCE TAB                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'maintenance' && (
        <div className="space-y-4">
          {/* Job status filter pills */}
          <div className="flex items-center gap-2">
            <button onClick={() => setJobStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${jobStatusFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              {t('fleet', 'allJobsCount')} ({jobs.length})
            </button>
            {(Object.keys(JOB_STATUS_CFG) as JobStatus[]).map(s => {
              const jcfg = JOB_STATUS_CFG[s]
              return (
                <button key={s} onClick={() => setJobStatusFilter(prev => prev === s ? 'all' : s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all`}
                  style={jobStatusFilter === s ? { background: jcfg.color, color: 'white', borderColor: jcfg.color } : { borderColor: `${jcfg.color}40`, color: jcfg.color, background: `${jcfg.color}10` }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {jobStatusLabel[s]} ({jobCounts[s]})
                </button>
              )
            })}

            {/* Cost total */}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
              <DollarSign size={12} className="text-emerald-500" />
              {t('fleet', 'totalRepairCost')} <strong className="text-emerald-600">{totalCostDone.toLocaleString()} ฿</strong>
            </div>
          </div>

          {/* Quick send button per vehicle in maintenance */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Wrench size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 flex-1">
              {t('fleet', 'jobsGoHint')}
            </p>
            <button onClick={() => setTab('fleet')}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors flex-shrink-0">
              <ArrowRight size={11} /> {t('fleet', 'goToFleet')}
            </button>
          </div>

          {/* Job grid */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList size={32} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">{t('fleet', 'noJobsFilter')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map(job => (
                <JobCard
                  key={job.id} job={job}
                  vehicle={vehicles.find(v => v.id === job.vehicleId)}
                  onUpdateStatus={updateJobStatus}
                  onClose={j => setCloseTarget(j)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* INSURANCE TAB                                        */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'insurance' && (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: t('fleet', 'insActive'), value: insCounts.active, icon: <BadgeCheck size={16} className="text-emerald-500" />, cls: 'from-emerald-50 to-green-50 border-emerald-100', vCls: 'text-emerald-700' },
              { label: t('fleet', 'insExpiring'), value: insCounts.expiring, icon: <ShieldAlert size={16} className="text-amber-500" />, cls: 'from-amber-50 to-yellow-50 border-amber-100', vCls: 'text-amber-700' },
              { label: t('fleet', 'insExpired'), value: insCounts.expired, icon: <ShieldOff size={16} className="text-red-500" />, cls: 'from-red-50 to-rose-50 border-red-100', vCls: 'text-red-700' },
              { label: t('fleet', 'prbWarn'), value: insCounts.prb_expiring, icon: <FileText size={16} className="text-indigo-500" />, cls: 'from-indigo-50 to-blue-50 border-indigo-100', vCls: 'text-indigo-700' },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.cls} border rounded-2xl p-4 flex items-center gap-3`}>
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">{s.icon}</div>
                <div>
                  <p className={`text-2xl font-extrabold ${s.vCls}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {(['all', 'ประกันภัย', 'พรบ'] as const).map(f => (
                <button key={f} onClick={() => setInsTypeFilter(f as InsType | 'all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${insTypeFilter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {f === 'all' ? t('fleet', 'allInsTypes') : insTypeLabel[f]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {([
                { key: 'all', label: t('fleet', 'allInsStatuses') },
                { key: 'active', label: t('fleet', 'insStatusActiveFilter') },
                { key: 'expiring', label: t('fleet', 'insStatusExpiringFilter') },
                { key: 'expired', label: t('fleet', 'insStatusExpiredFilter') },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setInsStatusFilter(f.key as InsStatus | 'all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${insStatusFilter === f.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-[10px] text-slate-400">{filteredPolicies.length} {t('fleet', 'items')}</div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_120px_100px_120px_120px_100px_110px] gap-x-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{t('common', 'vehicle')}</span><span>{t('fleet', 'vehicleType')}</span><span>{t('fleet', 'company')}</span><span>{t('fleet', 'insClass')}</span><span>{t('fleet', 'policyNo')}</span><span>{t('fleet', 'expireDate')}</span><span>{t('fleet', 'premium')} (฿)</span><span>{t('common', 'status')}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredPolicies.map(pol => {
                const rec = fleet.find(r => r.vehicle.id === pol.vehicleId)
                if (!rec) return null
                const daysLeft = Math.ceil((new Date(pol.expireDate).getTime() - Date.now()) / 86400000)
                const INS_STATUS_CFG = {
                  active: { label: t('fleet', 'insStatusActiveFilter'), cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                  expiring: { label: t('fleet', 'insStatusExpiringFilter'), cls: 'bg-amber-100 text-amber-700 border-amber-200' },
                  expired: { label: t('fleet', 'insStatusExpiredFilter'), cls: 'bg-red-100 text-red-700 border-red-200' },
                }
                const scfg = INS_STATUS_CFG[pol.status]
                return (
                  <div key={pol.id} className={`grid grid-cols-[1fr_100px_120px_100px_120px_120px_100px_110px] gap-x-3 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors text-xs ${pol.status === 'expired' ? 'bg-red-50/20' : pol.status === 'expiring' ? 'bg-amber-50/20' : ''}`}>
                    <div className="min-w-0">
                      <p className="font-bold font-mono text-slate-700">{rec.vehicle.license}</p>
                      <p className="text-[10px] text-slate-400 truncate">{rec.vehicle.vehicle_type?.name_th}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${pol.insType === 'พรบ' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                      {insTypeLabel[pol.insType]}
                    </span>
                    <span className="text-[11px] text-slate-600 truncate">{pol.company}</span>
                    <span className="text-[11px] font-mono text-slate-500">{pol.insClass}</span>
                    <span className="text-[10px] font-mono text-slate-500">{pol.policyNo}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-slate-700">{pol.expireDate}</p>
                      {daysLeft >= 0
                        ? <p className={`text-[9px] font-semibold mt-0.5 ${daysLeft < 30 ? 'text-red-500' : daysLeft < 90 ? 'text-amber-500' : 'text-slate-400'}`}>{daysLeft} {t('fleet', 'daysLeft')}</p>
                        : <p className="text-[9px] font-semibold text-red-500 mt-0.5">{t('fleet', 'expiredDaysAgo')} {Math.abs(daysLeft)} {t('fleet', 'daysLeft')}</p>
                      }
                    </div>
                    <span className="text-[11px] font-semibold font-mono text-slate-700">{pol.premium.toLocaleString()}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${scfg.cls}`}>{scfg.label}</span>
                      {pol.status !== 'active' && (
                        <button className="p-1 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors flex-shrink-0" title={t('fleet', 'renewTooltip')}>
                          <RefreshCw size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Small shared sub-components ────────────────────────────────
function FuelBar({ pct }: { pct: number }) {
  const color = pct <= 20 ? '#ef4444' : pct <= 40 ? '#f59e0b' : '#10b981'
  return (
    <div className="flex items-center gap-1">
      <Fuel size={9} style={{ color }} />
      <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  )
}

function MiniGauge({ label, value, max, unit, color, warn }: { label: string; value: number; max: number; unit: string; color: string; warn?: boolean }) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className={`text-[9px] font-semibold uppercase tracking-wide ${warn ? 'text-red-500' : 'text-slate-400'}`}>{label}</span>
        <span className="text-[9px] font-bold" style={{ color }}>{value.toLocaleString()} {unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value / max * 100)}%`, background: color }} />
      </div>
    </div>
  )
}

function StatusDropdown({ status, onChange }: { status: FleetStatus; onChange: (s: FleetStatus) => void }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CFG[status]
  const statusLabel: Record<FleetStatus, string> = {
    active: t('fleet', 'statusActive'),
    on_trip: t('fleet', 'statusOnTrip'),
    maintenance: t('fleet', 'statusMaint'),
    inactive: t('fleet', 'statusInactive'),
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
        {cfg.icon} {statusLabel[status]} <ChevronDown size={9} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-36">
          {(Object.keys(STATUS_CFG) as FleetStatus[]).map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50">
              <span style={{ color: STATUS_CFG[s].dot }}>{STATUS_CFG[s].icon}</span>
              {statusLabel[s]}
              {s === status && <Check size={9} className="ml-auto text-slate-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AssignModal({ vehicle, freeDrivers, onClose, onAssign }: {
  vehicle: Vehicle; freeDrivers: Driver[]; onClose: () => void; onAssign: (id: string) => void
}) {
  const { t } = useLang()
  const [sel, setSel] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-sm font-bold text-slate-800">{t('fleet', 'assignDriver')}</p><p className="text-[10px] text-slate-400 font-mono">{vehicle.license}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={14} /></button>
        </div>
        {freeDrivers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400"><Users size={24} className="mx-auto mb-2 text-slate-300" /> {t('fleet', 'noAvailableDriver')}</div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto mb-4">
            {freeDrivers.map(d => (
              <label key={d.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer border transition-colors ${sel === d.id ? 'bg-sky-50 border-sky-300' : 'border-slate-100 hover:bg-slate-50'}`}>
                <input type="radio" name="driver" value={d.id} checked={sel === d.id} onChange={() => setSel(d.id)} className="accent-sky-500" />
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{d.first_name_th.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">{d.first_name_th} {d.last_name_th}</p>
                  <p className="text-[9px] font-mono text-slate-400">{d.code}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50">{t('common', 'cancel')}</button>
          <button onClick={() => { if (sel) { onAssign(sel); onClose() } }} disabled={!sel}
            className="flex-1 text-sm font-bold text-white rounded-xl py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40">{t('fleet', 'assignDriver')}</button>
        </div>
      </div>
    </div>
  )
}
