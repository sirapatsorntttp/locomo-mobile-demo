'use client'
import { useState, useMemo, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'

import { useCompanyStore } from '@/lib/stores/company.store'

import { expandWorkdays, isHoliday, isPastCutoff, getAllowDaysLabel } from '@/lib/utils'
import {
  Search, CheckSquare, Square, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, ArrowLeftRight,
} from 'lucide-react'
import type { EmployeeFull, Shift } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useBookingStore } from '@/lib/stores/booking.store'
import { useReserveStore } from '@/lib/stores/reserve.store'
import { useCalendarStore } from '@/lib/stores/useCalendarStore';
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';

type TripMode = 'one_way' | 'round_trip'

// ─── Helpers ───────────────────────────────────────────────────
function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['เลือกพนักงาน', 'ตั้งค่าการจอง', 'ยืนยัน']
  return (
    <div className="flex items-center gap-0 mb-1">
      {steps.map((label, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        return (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {done ? <CheckCircle2 size={10} /> : <span>{n}</span>}
              {label}
            </div>
            {i < steps.length - 1 && <ChevronRight size={12} className="text-slate-300 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

function EmpRow({ emp, checked, onToggle }: { emp: EmployeeFull; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
        checked ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      <span className={`flex-shrink-0 ${checked ? 'text-sky-500' : 'text-slate-300'}`}>
        {checked ? <CheckSquare size={15} /> : <Square size={15} />}
      </span>
      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-violet-600">
        {emp.first_name_th.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate">{emp.first_name_th} {emp.last_name_th}</p>
        <p className="text-[10px] text-slate-400 font-mono">{emp.code} · {emp.defaults?.organizationUnit?.nameTh ?? '—'}</p>
      </div>
      <p className="text-[10px] text-slate-400 shrink-0">{emp.transport_defaults?.find(td => td.trip_direction === 'inbound')?.point?.name_th ?? '—'}</p>
    </button>
  )
}

// ─── Leg config panel (one for inbound, one for outbound) ─────
function LegPanel({
  label, icon, shiftId, onShiftChange, pointMode, onPointModeChange,
  overridePoint, onOverridePointChange, availableShifts,
  color = 'sky',
}: {
  label: string
  icon: React.ReactNode
  shiftId: string
  onShiftChange: (v: string) => void
  pointMode: 'default' | 'override'
  onPointModeChange: (v: 'default' | 'override') => void
  overridePoint: string
  onOverridePointChange: (v: string) => void
  availableShifts: Shift[]
  color?: 'sky' | 'emerald'
}) {
    const { points ,loadRoutesPoints} = useRoutePointStore()
  const borderCls = color === 'sky' ? 'border-sky-200 bg-sky-50' : 'border-emerald-200 bg-emerald-50'
  const labelCls  = color === 'sky' ? 'text-sky-700'             : 'text-emerald-700'

  return (
    <div className={`rounded-xl border p-3 space-y-3 ${borderCls}`}>
      <div className={`flex items-center gap-1.5 text-xs font-bold ${labelCls}`}>
        {icon} {label}
      </div>
      <Field label="กะ (shift)" required>
        <Select value={shiftId} onChange={e => onShiftChange(e.target.value)}>
          <option value="">— เลือกกะ —</option>
          {availableShifts.map(s => (
            <option key={s.id} value={s.id}>
              {s.name_th} · {s.default_time} น. ({s.type === 'overtime' ? 'OT' : 'ปกติ'})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="จุดจอด">
        <div className="flex gap-1.5 mb-2">
          {(['default', 'override'] as const).map(m => (
            <button
              key={m}
              onClick={() => onPointModeChange(m)}
              className={`flex-1 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                pointMode === m ? 'bg-white border-slate-400 text-slate-700 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:border-slate-200'
              }`}
            >
              {m === 'default' ? 'Default ของแต่ละคน' : 'กำหนดเอง'}
            </button>
          ))}
        </div>
        {pointMode === 'override' && (
          <Select value={overridePoint} onChange={e => onOverridePointChange(e.target.value)}>
            {points.map(p => <option key={p.id} value={p.id}>{p.name_th} · {p.code}</option>)}
          </Select>
        )}
      </Field>
    </div>
  )
}

// ─── Main Modal ─────────────────────────────────────────────────
export function BulkReserveModal() {
  const {
    modal, closeModal, currentCompanyId
  } = useStore()
  const {   bulkAddReserves } = useReserveStore()
  const {   bookingPolicies } = useBookingStore()
  const {shifts,loadShifts} = useShiftStore()
  const {employees,loadEmployees} = useEmployeeStore()
  const { calendars,loadCalendarGroups,loadCalendars } = useCalendarStore()
  const { points ,loadRoutesPoints} = useRoutePointStore()
  const{companies,loadCompanies,companyPlants} = useCompanyStore()
  const open = modal.type === 'bulk-reserve'

  const preCompanyId: string = modal.data?.company_id ?? currentCompanyId
  const prePolicyId: string  = modal.data?.policy_id  ?? ''

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // ── Step 1 state ──────────────────────────────────────────────
  const [orgUnitFilter, setOrgUnitFilter] = useState('')
  const [empSearch, setEmpSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())

  // ── Step 2 state ──────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)

  const activePolicy = useMemo(
    () => bookingPolicies.find(p => p.id === prePolicyId && p.is_status === 'active')
       ?? bookingPolicies.find(p => p.company_id === preCompanyId && p.is_status === 'active')
       ?? null,
    [bookingPolicies, prePolicyId, preCompanyId]
  )
  const plantCompanyId = useMemo(
    () => companyPlants.find(pc => pc.company_id === preCompanyId)?.id ?? 'pc-1',
    [preCompanyId]
  )

  // Trip mode
  const [tripMode, setTripMode] = useState<TripMode>('one_way')

  // Leg state: inbound (one-way or round-trip leg 1)
  const [inShiftId, setInShiftId]           = useState('')
  const [inPointMode, setInPointMode]       = useState<'default' | 'override'>('default')
  const [inOverridePoint, setInOverridePoint] = useState(points[0]?.id ?? '')

  // Leg state: outbound (round-trip leg 2)
  const [outShiftId, setOutShiftId]             = useState('')
  const [outPointMode, setOutPointMode]         = useState<'default' | 'override'>('default')
  const [outOverridePoint, setOutOverridePoint] = useState(points[0]?.id ?? '')

  // Date
  const [dateMode, setDateMode]     = useState<'single' | 'range'>('single')
  const [singleDate, setSingleDate] = useState(today)
  const [dateFrom, setDateFrom]     = useState(today)
  const [dateTo, setDateTo]         = useState(today)

  const [remark, setRemark] = useState('')
useEffect(() => {
   loadShifts()
   loadEmployees()
   loadCalendarGroups()
   loadCalendars()
   loadRoutesPoints()
   loadCompanies()
}, [])
  // ── Derived ───────────────────────────────────────────────────
  const activeEmployees = employees.filter(e => e.is_status === 'active')

  const orgUnitOptions = useMemo(() => {
    const seen = new Map<string, string>()
    activeEmployees.forEach(e => {
      const u = e.defaults?.organizationUnit
      if (u) seen.set(u.id, u.nameTh)
    })
    return Array.from(seen.entries())
  }, [activeEmployees])

  const filteredEmps = useMemo(() => activeEmployees.filter(e => {
    if (orgUnitFilter && e.defaults?.organizationUnit?.id !== orgUnitFilter) return false
    if (empSearch) {
      const q = `${e.first_name_th} ${e.last_name_th} ${e.code}`.toLowerCase()
      if (!q.includes(empSearch.toLowerCase())) return false
    }
    return true
  }), [activeEmployees, orgUnitFilter, empSearch])

  const allVisibleSelected = filteredEmps.length > 0 && filteredEmps.every(e => selected.has(e.id))
  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(s => { const n = new Set(s); filteredEmps.forEach(e => n.delete(e.id)); return n })
    } else {
      setSelected(s => { const n = new Set(s); filteredEmps.forEach(e => n.add(e.id)); return n })
    }
  }
  const toggleOne = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

 
  // Shift lists split by trip direction
  const inboundShifts  = useMemo(() => shifts.filter(s => s.is_status === 'active' && s.trip_direction === 'inbound'), [shifts])
  const outboundShifts = useMemo(() => shifts.filter(s => s.is_status === 'active' && s.trip_direction === 'outbound'), [shifts])
  // For one-way: show all shifts
  const allActiveShifts = useMemo(() => {
    const base = shifts.filter(s => s.is_status === 'active')
    if (activePolicy?.booking_policy_rules?.allow_days === 'weekday') return base.filter(s => s.type !== 'overtime')
    return base
  }, [shifts, activePolicy])

  const travelDates = useMemo((): string[] => {
    if (dateMode === 'single') return [singleDate]
    return expandWorkdays(dateFrom, dateTo, calendars, plantCompanyId)
  }, [dateMode, singleDate, dateFrom, dateTo, calendars, plantCompanyId])

  // Build legs for submission
  const legs = useMemo(() => {
    if (tripMode === 'one_way') return [{
      shift_id: inShiftId,
      point_mode: inPointMode,
      override_point_id: inPointMode === 'override' ? inOverridePoint : undefined,
    }]
    return [
      { shift_id: inShiftId,  point_mode: inPointMode,  override_point_id: inPointMode  === 'override' ? inOverridePoint  : undefined },
      { shift_id: outShiftId, point_mode: outPointMode, override_point_id: outPointMode === 'override' ? outOverridePoint : undefined },
    ]
  }, [tripMode, inShiftId, inPointMode, inOverridePoint, outShiftId, outPointMode, outOverridePoint])

  // Step 2 validation
  const step2Valid = useMemo(() => {
    if (!inShiftId || travelDates.length === 0) return false
    if (tripMode === 'round_trip' && !outShiftId) return false
    return true
  }, [inShiftId, outShiftId, tripMode, travelDates])

  // Preview
  const preview = useMemo(() => {
    if (step !== 3) return null
    let willCreate = 0, willSkip = 0, willBlock = 0
    const empList = employees.filter(e => selected.has(e.id))

    for (const emp of empList) {
      for (const leg of legs) {
        for (const dateKey of travelDates) {
          if (activePolicy) {
            const r = activePolicy.booking_policy_rules
            const holiday = isHoliday(dateKey, calendars, plantCompanyId)
            if (r?.allow_days === 'weekday' && holiday) { willBlock++; continue }
            if (r?.after_cutoff_action === 'block') { /* allow through */ }
          }
          willCreate++
        }
      }
    }
    return { willCreate, willSkip, willBlock, empCount: empList.length, dateCount: travelDates.length, legCount: legs.length }
  }, [step, selected, employees, legs, travelDates, activePolicy, calendars, plantCompanyId])

  const handleConfirm = () => {
    bulkAddReserves({
      employee_ids: Array.from(selected),
      trip_mode: tripMode,
      legs,
      travel_dates: travelDates,
      policy_id: activePolicy?.id,
      remark: remark || undefined,
    })
    setStep(1); setSelected(new Set()); setRemark('')
  }

  const handleClose = () => { setStep(1); setSelected(new Set()); closeModal() }

  if (!open) return null

  const inShift  = shifts.find(s => s.id === inShiftId)
  const outShift = shifts.find(s => s.id === outShiftId)

  const footer = (
    <div className="flex items-center justify-between w-full">
      <span className="text-xs text-slate-400">
        {step === 1 && `เลือกแล้ว ${selected.size} คน`}
        {step === 2 && `${selected.size} คน · ${travelDates.length} วัน · ${tripMode === 'round_trip' ? 'ไป-กลับ' : 'เที่ยวเดียว'}`}
        {step === 3 && preview && `${preview.willCreate} รายการที่จะสร้าง`}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={step === 1 ? handleClose : () => setStep(s => (s - 1) as 1 | 2 | 3)}>
          {step === 1 ? 'ยกเลิก' : <><ChevronLeft size={12} /> ย้อนกลับ</>}
        </Button>
        {step < 3 ? (
          <Button
            variant="primary" size="sm"
            onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
            disabled={step === 1 ? selected.size === 0 : !step2Valid}
          >
            ถัดไป <ChevronRight size={12} />
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!preview || preview.willCreate === 0}>
            ยืนยันจอง {preview?.willCreate ?? 0} รายการ
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      open={open} onClose={handleClose}
      title="จองรถเป็นกลุ่ม"
      subtitle={activePolicy ? `นโยบาย: ${activePolicy.name_th}` : 'ไม่มีนโยบาย'}
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        <StepBar step={step} />

        {/* ══ STEP 1: เลือกพนักงาน ══════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Field label="หน่วยงาน">
                <Select value={orgUnitFilter} onChange={e => setOrgUnitFilter(e.target.value)}>
                  <option value="">ทุกหน่วยงาน</option>
                  {orgUnitOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </Select>
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
                <Search size={12} className="text-slate-400" />
                <input
                  className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
                  placeholder="ค้นหาชื่อ, รหัส..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                />
              </div>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 font-medium whitespace-nowrap"
              >
                {allVisibleSelected ? <CheckSquare size={13} className="text-sky-500" /> : <Square size={13} />}
                {allVisibleSelected ? 'ยกเลิกทั้งหมด' : `เลือกทั้งหมด (${filteredEmps.length})`}
              </button>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-slate-500">พบ {filteredEmps.length} คน · เลือกแล้ว {selected.size} คน</p>
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())} className="text-[10px] text-red-500 hover:underline">ล้างการเลือก</button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto p-1 space-y-px">
                {filteredEmps.length === 0
                  ? <p className="text-xs text-slate-400 text-center py-8">ไม่พบพนักงาน</p>
                  : filteredEmps.map(emp => (
                    <EmpRow key={emp.id} emp={emp} checked={selected.has(emp.id)} onToggle={() => toggleOne(emp.id)} />
                  ))
                }
              </div>
            </div>
            {selected.size > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {employees.filter(e => selected.has(e.id)).map(e => (
                  <span key={e.id} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                    {e.first_name_th}
                    <button onClick={() => toggleOne(e.id)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ STEP 2: ตั้งค่าการจอง ══════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Policy badge */}
            {activePolicy && (
              <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sky-800">{activePolicy.name_th}</p>
                  <p className="text-sky-500 mt-0.5">{activePolicy.booking_policy_rules ? getAllowDaysLabel(activePolicy.booking_policy_rules.allow_days) : '—'} · Cutoff {activePolicy.booking_policy_rules?.cutoff_time ?? '—'} น.</p>
                </div>
                <Badge variant={activePolicy.booking_policy_rules?.booking_mode === 'assigned' ? 'info' : 'success'}>
                  {activePolicy.booking_policy_rules?.booking_mode === 'assigned' ? 'กำหนดโดยระบบ' : 'เลือกเอง'}
                </Badge>
              </div>
            )}

            {/* ── Trip Mode Toggle ─────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">ประเภทการเดินทาง</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTripMode('one_way')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                    tripMode === 'one_way'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <ArrowRight size={16} />
                  เที่ยวเดียว
                </button>
                <button
                  onClick={() => setTripMode('round_trip')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                    tripMode === 'round_trip'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <ArrowLeftRight size={16} />
                  ไป-กลับ
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                {tripMode === 'one_way'
                  ? 'สร้าง 1 รายการต่อพนักงาน ต่อวัน'
                  : 'สร้าง 2 รายการต่อพนักงาน ต่อวัน (ขาไป + ขากลับ)'}
              </p>
            </div>

            {/* ── Leg configuration ─────────────────────────────── */}
            {tripMode === 'one_way' ? (
              <LegPanel
                label="กะที่ต้องการจอง"
                icon={<ArrowRight size={12} />}
                shiftId={inShiftId}
                onShiftChange={setInShiftId}
                pointMode={inPointMode}
                onPointModeChange={setInPointMode}
                overridePoint={inOverridePoint}
                onOverridePointChange={setInOverridePoint}
                availableShifts={allActiveShifts}
                color="sky"
              />
            ) : (
              <div className="space-y-3">
                <LegPanel
                  label="ขาไป (Inbound — เข้างาน)"
                  icon={<ArrowRight size={12} />}
                  shiftId={inShiftId}
                  onShiftChange={setInShiftId}
                  pointMode={inPointMode}
                  onPointModeChange={setInPointMode}
                  overridePoint={inOverridePoint}
                  onOverridePointChange={setInOverridePoint}
                  availableShifts={inboundShifts.length ? inboundShifts : allActiveShifts}
                  color="sky"
                />
                <LegPanel
                  label="ขากลับ (Outbound — กลับบ้าน)"
                  icon={<ArrowRight size={12} className="rotate-180" />}
                  shiftId={outShiftId}
                  onShiftChange={setOutShiftId}
                  pointMode={outPointMode}
                  onPointModeChange={setOutPointMode}
                  overridePoint={outOverridePoint}
                  onOverridePointChange={setOutOverridePoint}
                  availableShifts={outboundShifts.length ? outboundShifts : allActiveShifts}
                  color="emerald"
                />
              </div>
            )}

            {/* ── Date ─────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">วันที่เดินทาง</p>
              <div className="flex gap-2 mb-3">
                {(['single', 'range'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setDateMode(m)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      dateMode === m ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {m === 'single' ? 'วันเดียว' : 'ช่วงวัน (range)'}
                  </button>
                ))}
              </div>
              {dateMode === 'single' ? (
                <Input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
              ) : (
                <div className="flex items-center gap-2">
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <span className="text-slate-400 text-xs shrink-0">ถึง</span>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              )}
              {dateMode === 'range' && (
                <p className="text-[10px] text-slate-400 mt-1.5">
                  วันทำงาน (ไม่นับวันหยุด): <span className="font-semibold text-slate-700">{travelDates.length} วัน</span>
                  {travelDates.length > 0 && <span className="ml-1">({travelDates[0]} – {travelDates[travelDates.length - 1]})</span>}
                </p>
              )}
            </div>

            <Field label="หมายเหตุ (ทุกรายการ)">
              <Textarea placeholder="ข้อมูลเพิ่มเติม..." value={remark} onChange={e => setRemark(e.target.value)} />
            </Field>
          </div>
        )}

        {/* ══ STEP 3: ยืนยัน ═════════════════════════════════════ */}
        {step === 3 && preview && (
          <div className="space-y-4">
            {/* Trip mode badge */}
            <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold ${
              tripMode === 'round_trip' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
            }`}>
              {tripMode === 'round_trip' ? <ArrowLeftRight size={16} /> : <ArrowRight size={16} />}
              {tripMode === 'round_trip' ? 'ไป-กลับ (2 รายการ/คน/วัน)' : 'เที่ยวเดียว (1 รายการ/คน/วัน)'}
            </div>

            {/* Count cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                <CheckCircle2 size={18} className="text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-700">{preview.willCreate}</p>
                <p className="text-[10px] text-emerald-500 font-semibold uppercase">จะสร้าง</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                <AlertTriangle size={18} className="text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-700">{preview.willSkip}</p>
                <p className="text-[10px] text-amber-500 font-semibold uppercase">ซ้ำ (ข้าม)</p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                <XCircle size={18} className="text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{preview.willBlock}</p>
                <p className="text-[10px] text-red-400 font-semibold uppercase">บล็อก</p>
              </div>
            </div>

            {/* Detail */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5 text-xs">
              <p className="font-semibold text-slate-700 mb-1">สรุปรายละเอียด</p>
              {[
                { label: 'พนักงาน', value: `${preview.empCount} คน` },
                { label: 'วันเดินทาง', value: dateMode === 'single' ? singleDate : `${travelDates[0]} – ${travelDates[travelDates.length - 1]} (${travelDates.length} วัน)` },
                { label: 'ประเภทการเดินทาง', value: tripMode === 'round_trip' ? 'ไป-กลับ' : 'เที่ยวเดียว' },
                ...(tripMode === 'one_way' ? [
                  { label: 'กะ', value: `${inShift?.name_th ?? '—'} · ${inShift?.default_time} น.` },
                ] : [
                  { label: 'กะขาไป', value: `${inShift?.name_th ?? '—'} · ${inShift?.default_time} น.` },
                  { label: 'กะขากลับ', value: `${outShift?.name_th ?? '—'} · ${outShift?.default_time} น.` },
                ]),
                { label: 'นโยบาย', value: activePolicy?.name_th ?? '— ไม่มี —' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="font-semibold text-slate-700">{r.value}</span>
                </div>
              ))}
            </div>

            {/* Employee chips */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 mb-2">พนักงาน ({preview.empCount} คน)</p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {employees.filter(e => selected.has(e.id)).map(e => (
                  <span key={e.id} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                    {e.first_name_th} {e.last_name_th}
                  </span>
                ))}
              </div>
            </div>

            {preview.willCreate === 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                <XCircle size={14} /> ไม่มีรายการที่สร้างได้ — ตรวจสอบนโยบายและวันที่
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
