'use client'
import { useState, useMemo, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import {
  getReserveStatusLabel, getReserveStatusVariant, formatDatetime,
  expandWorkdays, getAllowDaysLabel, getAfterCutoffLabel, isHoliday,
} from '@/lib/utils'
import { isAdmin } from '@/lib/auth-token'
import {
  Search, CheckCircle2, ChevronRight, ChevronLeft,
  ArrowRight, ArrowLeftRight,
} from 'lucide-react'
import type { Reserve, ReserveStatus, BookingPolicy, EmployeeFull, Shift } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useShiftGroupStore } from '@/lib/stores/shiftGroup.store'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useBookingStore } from '@/lib/stores/booking.store'
import { useReserveStore } from '@/lib/stores/reserve.store'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import { useCalendarStore } from '@/lib/stores/useCalendarStore';

// ─── Shared StepBar ──────────────────────────────────────────
function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['เลือกพนักงาน', 'ตั้งค่าการจอง', 'ยืนยัน']
  return (
    <div className="flex items-center gap-0 mb-1">
      {steps.map((label, i) => {
        const n = i + 1; const done = step > n; const active = step === n
        return (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
              {done ? <CheckCircle2 size={10} /> : <span>{n}</span>}
              {label}
            </div>
            {i < 2 && <ChevronRight size={12} className="text-slate-300 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── LegPanel (shared by single & bulk modals) ────────────────
function LegPanel({
  label, icon, color = 'sky',
  shiftId, onShiftChange, availableShifts,
  pointMode, onPointModeChange,
  overridePointId, onOverridePointChange,
  availablePoints,
  defaultPointLabel,
  showDirection,
}: {
  label: string; icon: React.ReactNode; color?: 'sky' | 'emerald' | 'violet'
  shiftId: string; onShiftChange: (v: string) => void; availableShifts: Shift[]
  pointMode: 'default' | 'override'; onPointModeChange: (v: 'default' | 'override') => void
  overridePointId: string; onOverridePointChange: (v: string) => void
  availablePoints: { id: string; name_th: string; code: string; routeName?: string }[]
  defaultPointLabel?: string
  showDirection?: boolean
}) {
  const border = color === 'emerald' ? 'border-emerald-200 bg-emerald-50' : color === 'violet' ? 'border-violet-200 bg-violet-50' : 'border-sky-200 bg-sky-50'
  const lbl    = color === 'emerald' ? 'text-emerald-700' : color === 'violet' ? 'text-violet-700' : 'text-sky-700'
  return (
    <div className={`rounded-xl border p-3 space-y-3 ${border}`}>
      <div className={`flex items-center gap-1.5 text-xs font-bold ${lbl}`}>{icon} {label}</div>
      <Field label="กะ (shift)" required>
        <Select value={shiftId} onChange={e => onShiftChange(e.target.value)}>
          <option value="">— เลือกกะ —</option>
          {availableShifts.map(s => (
            <option key={s.id} value={s.id}>
              {showDirection ? (s.trip_direction === 'outbound' ? '↑ ขากลับ · ' : '↓ ขาไป · ') : ''}
              {s.name_th} · {s.default_time} น. ({s.type === 'overtime' ? 'OT' : 'ปกติ'})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="จุดจอด">
        <div className="flex gap-1.5 mb-2">
          {(['default', 'override'] as const).map(m => (
            <button key={m} onClick={() => onPointModeChange(m)}
              className={`flex-1 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${pointMode === m ? 'bg-white border-slate-400 text-slate-700 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:border-slate-200'}`}>
              {m === 'default' ? 'Default ของพนักงาน' : 'กำหนดเอง'}
            </button>
          ))}
        </div>
        {pointMode === 'default'
          ? <p className="text-[10px] text-slate-500 bg-white rounded-lg px-2.5 py-2 border border-slate-200">{defaultPointLabel ?? 'ใช้จุดจอด default ของแต่ละคน'}</p>
          : (
            <Select value={overridePointId} onChange={e => onOverridePointChange(e.target.value)}>
              <option value="">— เลือกจุดจอด —</option>
              {availablePoints.map(p => (
                <option key={p.id} value={p.id}>{p.routeName ? `[${p.routeName}] ` : ''}{p.name_th} · {p.code}</option>
              ))}
            </Select>
          )
        }
      </Field>
    </div>
  )
}

// ─── Add Reserve Modal (3-step) ───────────────────────────────
export function AddReserveModal() {
  const {
    modal, closeModal, currentCompanyId,
  } = useStore()
  const { routes, points ,loadRoutesPoints} = useRoutePointStore()
  const { calendars } = useCalendarStore()
  const {bulkAddReserves} = useReserveStore()
  const {bookingPolicies} = useBookingStore()
  const {shifts, loadShifts} = useShiftStore()
  const {shiftGroups} = useShiftGroupStore()

  const {employees}=useEmployeeStore()
  const open = modal.type === 'add-reserve'

  const preCompanyId: string = modal.data?.company_id ?? currentCompanyId
  const prePolicyId: string  = modal.data?.policy_id  ?? ''

  const today = new Date().toISOString().slice(0, 10)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // ── Step 1: employee ──────────────────────────────────────
  const [empSearch, setEmpSearch]       = useState('')
  const [selectedEmpId, setSelectedEmpId] = useState('')

  // ── Step 2: booking config ────────────────────────────────
  const [tripMode, setTripMode]   = useState<'one_way' | 'round_trip'>('one_way')
  const [groupId, setGroupId]     = useState('')

  const [inShiftId,       setInShiftId]       = useState('')
  const [inPointMode,     setInPointMode]     = useState<'default' | 'override'>('default')
  const [inOverridePoint, setInOverridePoint] = useState('')

  const [outShiftId,       setOutShiftId]       = useState('')
  const [outPointMode,     setOutPointMode]     = useState<'default' | 'override'>('default')
  const [outOverridePoint, setOutOverridePoint] = useState('')

  const [dateMode,    setDateMode]    = useState<'single' | 'range'>('single')
  const [singleDate,  setSingleDate]  = useState(today)
  const [dateFrom,    setDateFrom]    = useState(today)
  const [dateTo,      setDateTo]      = useState(today)
  const [remark,      setRemark]      = useState('')
 
  // ── Derived ───────────────────────────────────────────────
  const activePolicy = useMemo(
    () => bookingPolicies.find(p => p.id === prePolicyId && p.is_status === 'active')
       ?? bookingPolicies.find(p => p.company_id === preCompanyId && p.is_status === 'active')
       ?? null,
    [bookingPolicies, prePolicyId, preCompanyId]
  )

  const activeEmps = useMemo(() => employees.filter(e => e.is_status === 'active'), [employees])
  const filteredEmps = useMemo(() => {
    if (!empSearch) return activeEmps
    const q = empSearch.toLowerCase()
    return activeEmps.filter(e => `${e.first_name_th} ${e.last_name_th} ${e.code}`.toLowerCase().includes(q))
  }, [activeEmps, empSearch])

  const selectedEmp = useMemo(() => employees.find(e => e.id === selectedEmpId), [employees, selectedEmpId])

  useEffect(() => {
    loadShifts()
    loadRoutesPoints()
  }, [])
  const inboundShifts  = useMemo(() => shifts.filter(s => s.is_status === 'active' && s.trip_direction === 'inbound'),  [shifts])
  const outboundShifts = useMemo(() => shifts.filter(s => s.is_status === 'active' && s.trip_direction === 'outbound'), [shifts])
  const allShifts      = useMemo(() => shifts.filter(s => s.is_status === 'active'), [shifts])

  // Shift groups that have both inbound and outbound shifts
  const availableGroups = useMemo(() => shiftGroups.filter(g => {
    const hasIn  = shifts.some(s => s.shift_group_id === g.id && s.trip_direction === 'inbound')
    const hasOut = shifts.some(s => s.shift_group_id === g.id && s.trip_direction === 'outbound')
    return hasIn && hasOut
  }), [shiftGroups, shifts])

  // When group changes → auto-fill inbound/outbound shifts
  const groupInShift  = useMemo(() => shifts.find(s => s.shift_group_id === groupId && s.trip_direction === 'inbound'),  [shifts, groupId])
  const groupOutShift = useMemo(() => shifts.find(s => s.shift_group_id === groupId && s.trip_direction === 'outbound'), [shifts, groupId])

  const handleGroupChange = (id: string) => {
    setGroupId(id)
    const gs = shifts.find(s => s.shift_group_id === id && s.trip_direction === 'inbound')
    const go = shifts.find(s => s.shift_group_id === id && s.trip_direction === 'outbound')
    if (gs) setInShiftId(gs.id)
    if (go) setOutShiftId(go.id)
  }

  // Points with route info for override
  const pointsWithRoute = (direction: 'inbound' | 'outbound') =>
    points
      .filter(p => p.is_status === 'active')
      .map(p => {
        const route = routes.find(r => r.id === p.route_id)
        if (route && route.trip_direction !== direction && route.trip_direction !== 'unknown') return null
        return { id: p.id, name_th: p.name_th, code: p.code, routeName: route?.name_th }
      })
      .filter(Boolean) as { id: string; name_th: string; code: string; routeName?: string }[]

  const inPoints  = useMemo(() => pointsWithRoute('inbound'),  [points, routes])
  const outPoints = useMemo(() => pointsWithRoute('outbound'), [points, routes])
  const allPoints = useMemo(() => pointsWithRoute('inbound').concat(pointsWithRoute('outbound')), [points, routes])

  // Employee default point labels
  const empDefaultPoint = (direction: 'inbound' | 'outbound') => {
    const td = selectedEmp?.transport_defaults?.find(t => t.trip_direction === direction)
    if (!td?.point) return 'ไม่มี default (ต้องกำหนดเอง)'
    const route = td.route ? `[${td.route.name_th}] ` : ''
    return `${route}${td.point.name_th} · ${td.point.code}`
  }

  const inShift  = shifts.find(s => s.id === inShiftId)
  const outShift = shifts.find(s => s.id === outShiftId)

  // Direction of the selected shift in one-way mode
  const oneWayDir = inShift?.trip_direction === 'outbound' ? 'outbound' : 'inbound'

  // Check holiday directly from loaded calendars (no plant_company_id filter needed
  // since the store only loads calendars for the current company context)
  const isCalHoliday = (d: string) => calendars.some(c => c.date_at === d && c.type === 'holiday')

  // Bookable dates: apply policy allow_days on top of calendar holiday exclusion
  const bookableDates = useMemo((): string[] => {
    const allowDays = activePolicy?.booking_policy_rules?.allow_days ?? 'any'
    const raw: string[] = []
    if (dateMode === 'single') {
      raw.push(singleDate)
    } else {
      const cur = new Date(dateFrom + 'T00:00:00')
      const end = new Date(dateTo + 'T00:00:00')
      while (cur <= end) {
        raw.push(cur.toISOString().slice(0, 10))
        cur.setDate(cur.getDate() + 1)
      }
    }
    if (allowDays === 'holiday_only') {
      return raw.filter(d => isCalHoliday(d))
    }
    const withoutHolidays = raw.filter(d => !isCalHoliday(d))
    if (allowDays === 'weekday') {
      return withoutHolidays.filter(d => { const day = new Date(d + 'T00:00:00').getDay(); return day !== 0 && day !== 6 })
    }
    return withoutHolidays
  }, [dateMode, singleDate, dateFrom, dateTo, activePolicy, calendars])

  const legs = useMemo(() => {
    if (tripMode === 'one_way') return [{ shift_id: inShiftId, point_mode: inPointMode, override_point_id: inPointMode === 'override' ? inOverridePoint : undefined }]
    return [
      { shift_id: inShiftId,  point_mode: inPointMode,  override_point_id: inPointMode  === 'override' ? inOverridePoint  : undefined },
      { shift_id: outShiftId, point_mode: outPointMode, override_point_id: outPointMode === 'override' ? outOverridePoint : undefined },
    ]
  }, [tripMode, inShiftId, inPointMode, inOverridePoint, outShiftId, outPointMode, outOverridePoint])

  const step2Valid = useMemo(() => {
    if (!inShiftId || bookableDates.length === 0) return false
    if (tripMode === 'round_trip' && !outShiftId) return false
    if (inPointMode === 'override' && !inOverridePoint) return false
    if (tripMode === 'round_trip' && outPointMode === 'override' && !outOverridePoint) return false
    return true
  }, [inShiftId, outShiftId, tripMode, bookableDates, inPointMode, inOverridePoint, outPointMode, outOverridePoint])

  const totalBookings = legs.length * bookableDates.length

  const handleClose = () => {
    setStep(1); setSelectedEmpId(''); setEmpSearch('')
    setTripMode('one_way'); setGroupId(''); setInShiftId(''); setOutShiftId('')
    setInPointMode('default'); setOutPointMode('default')
    setInOverridePoint(''); setOutOverridePoint('')
    setDateMode('single'); setSingleDate(today); setDateFrom(today); setDateTo(today)
    setRemark('')
    closeModal()
  }

  const handleConfirm = async () => {
    if (!selectedEmpId) return
    await bulkAddReserves({
      employee_ids: [selectedEmpId],
      trip_mode: tripMode,
      legs,
      travel_dates: bookableDates,
      policy_id: activePolicy?.id,
      remark: remark || undefined,
    })
    setStep(1); setSelectedEmpId(''); setEmpSearch('')
  }

  if (!open) return null

  const footer = (
    <div className="flex items-center justify-between w-full">
      <span className="text-xs text-slate-400">
        {step === 1 && (selectedEmpId ? `เลือก: ${selectedEmp?.first_name_th} ${selectedEmp?.last_name_th}` : 'ยังไม่ได้เลือกพนักงาน')}
        {step === 2 && `${bookableDates.length} วัน · ${tripMode === 'round_trip' ? 'ไป-กลับ' : 'เที่ยวเดียว'}`}
        {step === 3 && `${totalBookings} รายการที่จะสร้าง`}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={step === 1 ? handleClose : () => setStep(s => (s - 1) as 1 | 2 | 3)}>
          {step === 1 ? 'ยกเลิก' : <><ChevronLeft size={12} /> ย้อนกลับ</>}
        </Button>
        {step < 3 ? (
          <Button variant="primary" size="sm"
            onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
            disabled={step === 1 ? !selectedEmpId : !step2Valid}>
            ถัดไป <ChevronRight size={12} />
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleConfirm} disabled={totalBookings === 0}>
            ยืนยันจอง {totalBookings} รายการ
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={handleClose} title="จองรถ (รายเดี่ยว)"
      subtitle={activePolicy ? `นโยบาย: ${activePolicy.name_th}` : 'สร้างรายการจอง'}
      size="md" footer={footer}>
      <div className="space-y-4">
        <StepBar step={step} />

        {/* ══ STEP 1: เลือกพนักงาน ══════════════════════════ */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={12} className="text-slate-400" />
              <input className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
                placeholder="ค้นหาชื่อ, รหัสพนักงาน..."
                value={empSearch} onChange={e => setEmpSearch(e.target.value)} />
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-500">พบ {filteredEmps.length} คน</p>
              </div>
              <div className="max-h-64 overflow-y-auto p-1 space-y-px">
                {filteredEmps.length === 0
                  ? <p className="text-xs text-slate-400 text-center py-8">ไม่พบพนักงาน</p>
                  : filteredEmps.map(emp => (
                    <button key={emp.id} onClick={() => setSelectedEmpId(emp.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${selectedEmpId === emp.id ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-violet-600">{emp.first_name_th.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{emp.first_name_th} {emp.last_name_th}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{emp.code} · {emp.defaults?.organizationUnit?.nameTh ?? '—'}</p>
                      </div>
                      {selectedEmpId === emp.id && <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0" />}
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2: ตั้งค่าการจอง ══════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            {activePolicy && (
              <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sky-800">{activePolicy.name_th}</p>
                  <p className="text-sky-500 mt-0.5">{activePolicy.booking_policy_rules ? getAllowDaysLabel(activePolicy.booking_policy_rules.allow_days) : '—'} · Cutoff {activePolicy.booking_policy_rules?.cutoff_time ?? '—'} น.</p>
                </div>
                <Badge variant="success">เลือกเอง</Badge>
              </div>
            )}

            {/* Trip Mode */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">ประเภทการเดินทาง</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTripMode('one_way')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${tripMode === 'one_way' ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'}`}>
                  <ArrowRight size={16} /> เที่ยวเดียว
                </button>
                <button onClick={() => setTripMode('round_trip')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${tripMode === 'round_trip' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'}`}>
                  <ArrowLeftRight size={16} /> ไป-กลับ
                </button>
              </div>
            </div>

            {/* Round-trip: select group */}
            {tripMode === 'round_trip' && availableGroups.length > 0 && (
              <Field label="กลุ่มกะ (Shift Group)" hint="เลือกกลุ่มเพื่อดึง inbound + outbound อัตโนมัติ">
                <Select value={groupId} onChange={e => handleGroupChange(e.target.value)}>
                  <option value="">— เลือกกลุ่มกะ —</option>
                  {availableGroups.map(g => {
                    const inS  = shifts.find(s => s.shift_group_id === g.id && s.trip_direction === 'inbound')
                    const outS = shifts.find(s => s.shift_group_id === g.id && s.trip_direction === 'outbound')
                    return <option key={g.id} value={g.id}>{g.name_th} · ↓{inS?.default_time ?? '?'} / ↑{outS?.default_time ?? '?'}</option>
                  })}
                </Select>
                {groupId && groupInShift && groupOutShift && (
                  <div className="mt-2 flex gap-2 text-[10px]">
                    <span className="bg-sky-50 border border-sky-100 text-sky-700 rounded-lg px-2 py-1">↓ เข้า {groupInShift.default_time} น.</span>
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-2 py-1">↑ ออก {groupOutShift.default_time} น.</span>
                  </div>
                )}
              </Field>
            )}

            {/* Leg config */}
            {tripMode === 'one_way' ? (
              <LegPanel label="กะที่ต้องการจอง" icon={<ArrowRight size={12} />}
                shiftId={inShiftId} onShiftChange={setInShiftId} availableShifts={allShifts}
                pointMode={inPointMode} onPointModeChange={setInPointMode}
                overridePointId={inOverridePoint} onOverridePointChange={setInOverridePoint}
                availablePoints={oneWayDir === 'outbound' ? outPoints : inPoints}
                defaultPointLabel={empDefaultPoint(oneWayDir)}
                showDirection color="sky" />
            ) : (
              <div className="space-y-3">
                <LegPanel label="↓ ขาไป (Inbound — เข้างาน)" icon={<ArrowRight size={12} />}
                  shiftId={inShiftId} onShiftChange={setInShiftId} availableShifts={inboundShifts.length ? inboundShifts : allShifts}
                  pointMode={inPointMode} onPointModeChange={setInPointMode}
                  overridePointId={inOverridePoint} onOverridePointChange={setInOverridePoint}
                  availablePoints={inPoints} defaultPointLabel={empDefaultPoint('inbound')}
                  color="sky" />
                <LegPanel label="↑ ขากลับ (Outbound — กลับบ้าน)" icon={<ArrowRight size={12} className="rotate-180" />}
                  shiftId={outShiftId} onShiftChange={setOutShiftId} availableShifts={outboundShifts.length ? outboundShifts : allShifts}
                  pointMode={outPointMode} onPointModeChange={setOutPointMode}
                  overridePointId={outOverridePoint} onOverridePointChange={setOutOverridePoint}
                  availablePoints={outPoints} defaultPointLabel={empDefaultPoint('outbound')}
                  color="emerald" />
              </div>
            )}

            {/* Date */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">วันที่เดินทาง</p>
              <div className="flex gap-2 mb-3">
                {(['single', 'range'] as const).map(m => (
                  <button key={m} onClick={() => setDateMode(m)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${dateMode === m ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'}`}>
                    {m === 'single' ? 'วันเดียว' : 'ช่วงวัน (range)'}
                  </button>
                ))}
              </div>
              {dateMode === 'single'
                ? <Input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
                : (
                  <div className="flex items-center gap-2">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    <span className="text-slate-400 text-xs shrink-0">ถึง</span>
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  </div>
                )
              }
              {dateMode === 'range' && (
                <p className="text-[10px] text-slate-400 mt-1.5">
                  จองได้จริง: <span className="font-semibold text-slate-700">{bookableDates.length} วัน</span>
                  {activePolicy?.booking_policy_rules?.allow_days === 'weekday' && ' (กรองเฉพาะวันทำงาน จ-ศ)'}
                  {activePolicy?.booking_policy_rules?.allow_days === 'holiday_only' && ' (เฉพาะวันหยุด)'}
                </p>
              )}
            </div>

            <Field label="หมายเหตุ">
              <Textarea placeholder="ข้อมูลเพิ่มเติม..." value={remark} onChange={e => setRemark(e.target.value)} />
            </Field>
          </div>
        )}

        {/* ══ STEP 3: ยืนยัน ════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold ${tripMode === 'round_trip' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
              {tripMode === 'round_trip' ? <ArrowLeftRight size={16} /> : <ArrowRight size={16} />}
              {tripMode === 'round_trip' ? 'ไป-กลับ (2 รายการ/วัน)' : 'เที่ยวเดียว (1 รายการ/วัน)'}
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5 text-xs">
              <p className="font-semibold text-slate-700">สรุปรายละเอียด</p>
              {[
                { label: 'พนักงาน', value: `${selectedEmp?.first_name_th} ${selectedEmp?.last_name_th} · ${selectedEmp?.code}` },
                { label: 'วันเดินทาง', value: dateMode === 'single' ? singleDate : `${bookableDates[0]} – ${bookableDates[bookableDates.length - 1]} (${bookableDates.length} วัน)` },
                { label: 'ประเภท', value: tripMode === 'round_trip' ? 'ไป-กลับ' : 'เที่ยวเดียว' },
                ...(tripMode === 'one_way'
                  ? [{ label: 'กะ', value: `${inShift?.name_th ?? '—'} · ${inShift?.default_time} น.` }]
                  : [
                    { label: 'กะขาไป', value: `${inShift?.name_th ?? '—'} · ${inShift?.default_time} น.` },
                    { label: 'กะขากลับ', value: `${outShift?.name_th ?? '—'} · ${outShift?.default_time} น.` },
                  ]
                ),
                { label: 'นโยบาย', value: activePolicy?.name_th ?? '— ไม่มี —' },
                { label: 'รวมรายการ', value: `${totalBookings} รายการ` },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="font-semibold text-slate-700">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── View Reserve Modal ───────────────────────────────────────
export function ViewReserveModal() {
  const { modal, closeModal } = useStore()
   const {updateReserveState} = useReserveStore()
  const open = modal.type === 'view-reserve'
  const res: Reserve | undefined = modal.data
  if (!res || !open) return null

  const stateActions: { state: ReserveStatus; label: string; variant: 'primary' | 'danger' | 'secondary' }[] = [
    { state: 'approved', label: 'อนุมัติ', variant: 'primary' },
    { state: 'canceled', label: 'ยกเลิก', variant: 'danger' },
    { state: 'finished', label: 'เสร็จสิ้น', variant: 'secondary' },
  ]

const handleChangeState = async (id:string,state: ReserveStatus) => {
    try {
      await updateReserveState(id, state)
      closeModal()                              
    } catch (err) {
      console.error(err)
     
    }
  }

  return (
    <Modal open={open} onClose={closeModal} title="รายละเอียดการจอง" subtitle={`ID: ${res.id}`} size="md"
      footer={<Button variant="secondary" size="sm" onClick={closeModal}>ปิด</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="font-bold text-slate-800">{res.employee?.first_name_th} {res.employee?.last_name_th}</p>
            <p className="text-xs text-slate-400 font-mono">{res.employee?.code} · {res.employee?.rfid}</p>
          </div>
          <Badge variant={getReserveStatusVariant(res.is_state)}>{getReserveStatusLabel(res.is_state)}</Badge>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { label: 'กะ (shift)', value: `${res.shift?.name_th} · ${res.shift?.default_time} น.` },
            { label: 'จุดจอด (point)', value: res.point?.name_th ?? '-' },
            { label: 'โซน (zone)', value: res.plant_company_zone?.zone?.name_th ?? '-' },
            { label: 'วันที่เดินทาง', value: res.travel_date.slice(0, 10) },
            { label: 'แพลตฟอร์ม', value: `${res.platform} · ${res.device}` },
            { label: 'นโยบาย', value: res.policy?.name_th ?? '—' },
            { label: 'หมายเหตุ', value: res.remark ?? '-' },
            { label: 'จองเมื่อ', value: formatDatetime(res.created_at) },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-slate-700 font-semibold">{r.value}</span>
            </div>
          ))}
        </div>

        {res.is_state !== 'finished' && res.is_state !== 'canceled' && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">เปลี่ยนสถานะ</p>
            <div className="flex gap-2">
              {stateActions.filter(a => a.state !== res.is_state).map(a => (
                <Button key={a.state} variant={a.variant} size="sm" onClick={() => handleChangeState(res.id, a.state)}>
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Delete Reserve Modal ─────────────────────────────────────
export function DeleteReserveModal() {
  const { modal, closeModal } = useStore()
   const {deleteReserve} = useReserveStore()
  const open = modal.type === 'delete-reserve'
  const res: Reserve | undefined = modal.data
  if (!res || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบรายการจอง" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteReserve(res.id)}>ลบรายการ</Button>
      </>}
    >
      <div className="text-center py-4 text-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-2xl">🗑️</div>
        <p className="font-semibold text-slate-800">{res.employee?.first_name_th} {res.employee?.last_name_th}</p>
        <p className="text-xs text-slate-400 mt-1">{res.shift?.name_th} · {res.point?.name_th}</p>
        <p className="text-xs text-slate-400">{res.travel_date.slice(0, 10)}</p>
        <p className="text-xs text-red-600 mt-3 bg-red-50 rounded-lg p-2 border border-red-200">รายการนี้จะถูกลบถาวร</p>
      </div>
    </Modal>
  )
}
