'use client'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { CalendarDays, Bus, Search, Users, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'

import { useRouteServicesStore } from '@/lib/stores/route-services-store'

// ── Types ─────────────────────────────────────────────────────────────────────
type VehicleType = 'van' | 'bus' | null



// ── Shift labels (4 shifts × in/out) ─────────────────────────────────────────
const SHIFT_SLOTS: { shiftNum: number; label: string; dir: 'in' | 'out'; field: 'in' | 'out' }[] = [
  { shiftNum: 1, label: 'กะ 1', dir: 'in',  field: 'in'  },
  { shiftNum: 1, label: 'กะ 1', dir: 'out', field: 'out' },
  { shiftNum: 2, label: 'กะ 2', dir: 'in',  field: 'in'  },
  { shiftNum: 2, label: 'กะ 2', dir: 'out', field: 'out' },
  { shiftNum: 3, label: 'กะ 3', dir: 'in',  field: 'in'  },
  { shiftNum: 3, label: 'กะ 3', dir: 'out', field: 'out' },
  { shiftNum: 4, label: 'กะ 4', dir: 'in',  field: 'in'  },
  { shiftNum: 4, label: 'กะ 4', dir: 'out', field: 'out' },
]

// Distinct shift groups for header row 1
const SHIFT_GROUPS = [1, 2, 3, 4]

function normalizeVehicle(v: string | null): VehicleType {
  if (!v) return null
  const u = v.trim().toLowerCase()
  if (u === 'bus') return 'bus'
  return 'van'
}

// ── Vehicle SVG Icons ─────────────────────────────────────────────────────────
function VanIcon() {
  return (
    <svg viewBox="0 0 80 40" className="w-14 h-7" fill="none">
      <rect x="4" y="10" width="62" height="24" rx="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="8" y="14" width="24" height="13" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
      <rect x="34" y="14" width="24" height="13" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
      <rect x="4" y="10" width="12" height="24" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5"/>
      <circle cx="16" cy="35" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5"/>
      <circle cx="16" cy="35" r="2.5" fill="#94a3b8"/>
      <circle cx="55" cy="35" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5"/>
      <circle cx="55" cy="35" r="2.5" fill="#94a3b8"/>
      <rect x="2" y="20" width="4" height="6" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.5"/>
      <rect x="64" y="22" width="4" height="5" rx="1" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.5"/>
    </svg>
  )
}

function BusIcon() {
  return (
    <svg viewBox="0 0 100 48" className="w-20 h-10" fill="none">
      <rect x="2" y="6" width="90" height="32" rx="4" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1.5"/>
      <rect x="2" y="6" width="90" height="10" rx="4" fill="#2563eb"/>
      <rect x="6" y="12" width="14" height="10" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8"/>
      <rect x="24" y="12" width="14" height="10" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8"/>
      <rect x="42" y="12" width="14" height="10" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8"/>
      <rect x="60" y="12" width="14" height="10" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8"/>
      <rect x="6" y="26" width="14" height="8" rx="2" fill="#93c5fd" stroke="#60a5fa" strokeWidth="0.8"/>
      <rect x="24" y="26" width="14" height="8" rx="2" fill="#93c5fd" stroke="#60a5fa" strokeWidth="0.8"/>
      <rect x="42" y="26" width="14" height="8" rx="2" fill="#93c5fd" stroke="#60a5fa" strokeWidth="0.8"/>
      <rect x="60" y="26" width="14" height="8" rx="2" fill="#93c5fd" stroke="#60a5fa" strokeWidth="0.8"/>
      <rect x="78" y="8" width="12" height="22" rx="2" fill="#1e40af"/>
      <circle cx="18" cy="41" r="7" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5"/>
      <circle cx="18" cy="41" r="3.5" fill="#64748b"/>
      <circle cx="72" cy="41" r="7" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5"/>
      <circle cx="72" cy="41" r="3.5" fill="#64748b"/>
      <rect x="1" y="16" width="3" height="9" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.5"/>
      <rect x="89" y="18" width="3" height="8" rx="1" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.5"/>
    </svg>
  )
}

function VehicleIcon({ type }: { type: VehicleType }) {
  if (!type) return null
  if (type === 'bus') return <BusIcon/>
  return <VanIcon/>
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const THAI_DAYS   = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์']
const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

function formatThaiDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day   = THAI_DAYS[d.getDay()]
  const date  = d.getDate()
  const month = THAI_MONTHS[d.getMonth()]
  const year  = d.getFullYear() + 543
  return `${day} ${date} ${month} ${year}`
}

function isWeekend(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getDay() === 0 || d.getDay() === 6
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { t, lang } = useLang()

  const today = new Date().toISOString().split('T')[0]
  const [dateVal, setDateVal]         = useState('2026-07-20')
  const [displayDate, setDisplayDate] = useState('2026-07-20')
  const [search, setSearch]           = useState('')

const items = useRouteServicesStore(s => s.items)
const loading = useRouteServicesStore(s => s.isLoading)
const error = useRouteServicesStore(s => s.error)
const loadByDate = useRouteServicesStore(s => s.loadByDate)



  // Load data on initial render and when displayDate changes
  useEffect(() => {
    loadByDate(displayDate)
  }, [displayDate, loadByDate])


  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return ''
    if (lang === 'en') return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return formatThaiDate(dateStr)
  }


  const scheduleType = isWeekend(displayDate) ? 'holiday' : 'workday'

  // Filter by route_code search
  const rows = useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter(r =>
      r.route_code.toLowerCase().includes(q) ||
      r.route_name_th.toLowerCase().includes(q) ||
      r.route_name_en.toLowerCase().includes(q)
    )
  }, [items, search])

  // Determine which shift slots have any data (to hide empty columns)
  const activeSlots = useMemo(() => {
    return SHIFT_SLOTS.filter(slot =>
      items.some(r => {
        const s = r.shifts.find(sh => sh.shift_number === slot.shiftNum)
        if (!s) return false
        const val = slot.field === 'in' ? s.passenger_in : s.passenger_out
        return (val ?? 0) > 0
      })
    )
  }, [items])

  const activeShiftGroups = useMemo(() =>
    SHIFT_GROUPS.filter(n => activeSlots.some(s => s.shiftNum === n))
  , [activeSlots])

  // KPI
  const totalTrips = useMemo(() =>
    rows.reduce((sum, r) =>
      sum + r.shifts.reduce((s, sh) => s + ((sh.passenger_in ?? 0) > 0 ? 1 : 0) + ((sh.passenger_out ?? 0) > 0 ? 1 : 0), 0)
    , 0)
  , [rows])

  const totalPax = useMemo(() =>
    rows.reduce((sum, r) =>
      sum + r.shifts.reduce((s, sh) => s + (sh.passenger_in ?? 0) + (sh.passenger_out ?? 0), 0)
    , 0)
  , [rows])

  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-200">
            <CalendarDays size={18} className="text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t('schedule', 'title')}</h1>
            <p className="text-xs text-slate-400">{t('schedule', 'routeLabel')} · {scheduleType === 'holiday' ? t('schedule', 'holidayLabel') : t('schedule', 'workdayLabel')}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex items-center gap-3">
          {[
            { label: t('schedule','routeLabel'),       value: rows.length, color: 'text-sky-700',     bg: 'text-sky-400'     },
            { label: t('schedule','totalTrips'),      value: totalTrips,  color: 'text-violet-700',  bg: 'text-violet-400'  },
            { label: t('schedule','totalPassengers'), value: totalPax,    color: 'text-emerald-700', bg: 'text-emerald-400' },
          ].map(k => (
            <div key={k.label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Bus size={12} className={k.bg}/>
              <span className={`text-sm font-bold ${k.color}`}>{k.value}</span>
              <span className="text-[10px] text-slate-400">{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs">
          <CalendarDays size={14} className="text-slate-400 flex-shrink-0"/>
          <input
            type="date"
            value={dateVal}
            onChange={e => setDateVal(e.target.value)}
            className="text-sm text-slate-700 outline-none bg-transparent flex-1"
          />
        </div>
        <button
          onClick={() => setDisplayDate(dateVal)}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-sky-200 hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Search size={14}/>}
          {t('schedule', 'showData')}
        </button>

        {/* Search route */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs ml-auto">
          <Search size={14} className="text-slate-400 flex-shrink-0"/>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('schedule', 'searchPlaceholder')}
            className="text-sm text-slate-700 outline-none bg-transparent flex-1 placeholder:text-slate-300"
          />
        </div>

        {/* Schedule type badge */}
        <span className={cn(
          'px-3 py-1.5 rounded-xl text-xs font-bold border',
          scheduleType === 'holiday'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        )}>
          {scheduleType === 'holiday' ? t('schedule', 'holiday') : t('schedule', 'workday')}
        </span>
      </div>

      {/* ── Date Display ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 text-center">
        <h2 className="text-lg font-bold text-sky-600">{formatDate(displayDate)}</h2>
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex-shrink-0">
          <AlertCircle size={15}/>
          <span>{error}</span>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-2xl">
            <Loader2 size={28} className="animate-spin text-sky-500"/>
          </div>
        )}
        <table className="w-full border-collapse min-w-max">
          <thead>
            {/* Row 1: shift group headers */}
            <tr className="bg-gradient-to-r from-sky-50 to-blue-50">
              <th rowSpan={2}
                className="border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-sm"
                style={{ minWidth: 100 }}>
                <div className="flex flex-col items-center gap-1">
                  <Bus size={14} className="text-sky-500"/>
                  <span>{t('schedule', 'routeLabel')}</span>
                  <span className="text-[9px] font-normal text-slate-400">{t('schedule', 'service')}</span>
                </div>
              </th>
              {activeShiftGroups.map(n => {
                const cols = activeSlots.filter(s => s.shiftNum === n).length
                return (
                  <th key={n} colSpan={cols * 2}
                    className="border border-slate-200 px-2 py-2.5 text-center text-xs font-bold bg-sky-100 text-sky-700">
                    กะที่ {n}
                  </th>
                )
              })}
            </tr>
            {/* Row 2: in/out sub-columns */}
            <tr className="bg-slate-50">
              {activeSlots.map((slot, i) => (
                <React.Fragment key={i}>
                  <th className="border border-slate-200 px-2 py-2 text-center text-[10px] font-semibold text-slate-500" style={{ minWidth: 60 }}>
                    <div className="flex items-center justify-center gap-0.5">
                      <span className={cn('text-[9px] px-1 py-0.5 rounded-full font-bold mr-0.5', slot.dir === 'in' ? 'bg-sky-100 text-sky-700' : 'bg-blue-100 text-blue-700')}>
                        {slot.dir === 'in' ? t('schedule','inbound2') : t('schedule','outbound2')}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      <Users size={9}/> {t('schedule','passengerCount')}
                    </div>
                  </th>
                  <th className="border border-slate-200 px-2 py-2 text-center text-[10px] font-semibold text-slate-500" style={{ minWidth: 90 }}>
                    {t('schedule','vehicleType')}
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={1 + activeSlots.length * 2} className="py-16 text-center text-slate-300 text-sm">
                  {error ? '' : t('schedule', 'notFound')}
                </td>
              </tr>
            ) : rows.map((row, ri) => (
              <tr key={row.id} className={cn('transition-colors hover:bg-sky-50/30', ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                {/* Route name */}
                <td className={cn('border border-slate-200 px-4 py-3 sticky left-0 z-10 shadow-sm', ri % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0"/>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-sky-600 whitespace-nowrap">
                        {lang === 'en' ? row.route_name_en : row.route_name_th}
                      </span>
                      <span className="text-[10px] text-slate-400">{row.route_code}</span>
                    </div>
                  </div>
                </td>

                {/* Slot cells */}
                {activeSlots.map((slot, si) => {
                  const shift = row.shifts.find(s => s.shift_number === slot.shiftNum)
                  const count   = slot.field === 'in' ? (shift?.passenger_in ?? 0) : (shift?.passenger_out ?? 0)
                  const vehicle = slot.field === 'in' ? shift?.vehicle_in : shift?.vehicle_out
                  const vType   = normalizeVehicle(vehicle ?? null)
                  const hasData = (count ?? 0) > 0
                  return (
                    <React.Fragment key={si}>
                      <td className="border border-slate-200 px-2 py-3 text-center">
                        {hasData ? (
                          <span className={cn('text-sm font-bold px-2 py-0.5 rounded-lg', slot.dir === 'in' ? 'bg-sky-100 text-sky-700' : 'bg-blue-100 text-blue-700')}>
                            {count}
                          </span>
                        ) : null}
                      </td>
                      <td className="border border-slate-200 px-2 py-3">
                        {hasData && vType ? (
                          <div className="flex justify-center">
                            <VehicleIcon type={vType}/>
                          </div>
                        ) : null}
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
          {/* Footer totals */}
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gradient-to-r from-sky-50 to-blue-50 border-t-2 border-sky-200">
                <td className="border border-slate-200 px-4 py-2.5 sticky left-0 bg-sky-50 z-10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('schedule','total')}</span>
                </td>
                {activeSlots.map((slot, si) => {
                  const total = rows.reduce((sum, r) => {
                    const s = r.shifts.find(sh => sh.shift_number === slot.shiftNum)
                    return sum + (slot.field === 'in' ? (s?.passenger_in ?? 0) : (s?.passenger_out ?? 0))
                  }, 0)
                  const trips = rows.filter(r => {
                    const s = r.shifts.find(sh => sh.shift_number === slot.shiftNum)
                    return (slot.field === 'in' ? (s?.passenger_in ?? 0) : (s?.passenger_out ?? 0)) > 0
                  }).length
                  return (
                    <React.Fragment key={si}>
                      <td className="border border-slate-200 px-2 py-2.5 text-center">
                        {total > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-slate-700">{total}</span>
                            <span className="text-[9px] text-slate-400">{trips} {t('routes','line') ?? 'สาย'}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="border border-slate-200"/>
                    </React.Fragment>
                  )
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
