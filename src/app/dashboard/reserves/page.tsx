'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  BookOpen, Plus, Search, Download, Eye, Trash2,
  ShieldCheck, Clock, CalendarCheck, AlertTriangle, CheckCircle2,
  Users, X, Ban, Pencil, CheckSquare, Square, MinusSquare,
} from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useCompanyStore } from '@/lib/stores/company.store'
import {
  getReserveStatusLabel, getReserveStatusVariant, getPlatformIcon,
  getAllowDaysLabel, getAfterCutoffLabel, isPastCutoffTime,
} from '@/lib/utils'
import { isAdmin } from '@/lib/auth-token'
import { useLang } from '@/lib/lang-context'
import type { ReserveStatus, BookingPolicy } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useShiftGroupStore } from '@/lib/stores/shiftGroup.store'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useReserveStore } from '@/lib/stores/reserve.store'
import { useBookingStore } from '@/lib/stores/booking.store'
import { useCalendarStore } from '@/lib/stores/useCalendarStore';
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';

export default function ReservesPage() {
  const { openModal, currentCompanyId } = useStore()
  const { bulkCancelReserves, loadReserves, updateReserveState, reserves } = useReserveStore()
  const { loadBookingPolicies, bookingPolicies, } = useBookingStore()
  const { shifts, loadShifts } = useShiftStore()
  const { loadShiftGroups } = useShiftGroupStore()
  const { loadEmployees } = useEmployeeStore()
  const { calendars } = useCalendarStore()
  const { loadRoutesPoints } = useRoutePointStore()
  const {companyPlants} = useCompanyStore()
  const { t } = useLang() 

  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<ReserveStatus | 'all'>('all')
  const [shiftFilter, setShiftFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Default: current month
  const now = new Date()
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)

  useEffect(() => {
    loadReserves({ date_from: dateFrom, date_to: dateTo })
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadEmployees()
    loadShifts()
    loadRoutesPoints()
    loadShiftGroups()
    if (bookingPolicies.length === 0) loadBookingPolicies()
  }, [])

  const activePolicy = useMemo(
    () => bookingPolicies.find(p => p.company_id === currentCompanyId && p.is_status === 'active') ?? null,
    [bookingPolicies, currentCompanyId]
  )

  const plantCompanyId = useMemo(
    () => companyPlants.find(pc => pc.company_id === currentCompanyId)?.id ?? 'pc-1',
    [currentCompanyId]
  )

  const _r = activePolicy?.booking_policy_rules
  const isAdminUser = isAdmin()
  const isAutoMode = _r?.booking_mode === 'assigned' && !isAdminUser
  const isHolidayOnly = _r?.allow_days === 'weekday'
  const cutoff = _r ? `${_r.cutoff_time} น.` : null
  const afterCutoff = _r ? isPastCutoffTime(_r.cutoff_time) : false
  const cutoffBlocks = _r?.after_cutoff_action === 'block'
  const needsGAApproval = _r?.after_cutoff_action === 'require_approval'
  const hasApproval = _r ? (_r.ot_requires_approval || _r.holiday_requires_approval) : false

  const companyReserves = useMemo(() => {
    if (!activePolicy) return reserves
    return reserves.filter(r => r.policy_id === activePolicy.id || r.policy_id === null)
  }, [reserves, activePolicy])

  const filtered = useMemo(() => {
    return companyReserves.filter(r => {
      const q = `${r.employee?.first_name_th ?? ''} ${r.employee?.last_name_th ?? ''} ${r.employee?.code ?? ''}`.toLowerCase()
      return q.includes(search.toLowerCase())
        && (stateFilter === 'all' || r.is_state === stateFilter)
        && (!shiftFilter || r.shift_id === shiftFilter)
    })
  }, [companyReserves, search, stateFilter, shiftFilter])

  const counts = {
    all: companyReserves.length,
    waiting: companyReserves.filter(r => r.is_state === 'waiting').length,
    approved: companyReserves.filter(r => r.is_state === 'approved').length,
    canceled: companyReserves.filter(r => r.is_state === 'canceled').length,
    finished: companyReserves.filter(r => r.is_state === 'finished').length,
  }

  const filteredIds = filtered.map(r => r.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id))
  const someSelected = filteredIds.some(id => selectedIds.has(id)) && !allSelected

  const toggleRow = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const next = new Set(prev); filteredIds.forEach(id => next.delete(id)); return next })
    } else {
      setSelectedIds(prev => new Set([...prev, ...filteredIds]))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())
  const selectedInView = filteredIds.filter(id => selectedIds.has(id))

  const openAddModal = () => {
    if (activePolicy) {
      openModal('add-reserve', { company_id: currentCompanyId, policy_id: activePolicy.id })
    } else {
      openModal('add-reserve')
    }
  }

  const handleBulkCancel = () => { bulkCancelReserves([...selectedIds]); clearSelection() }
  const handleBulkEditShift = () => openModal('bulk-edit-reserve', { ids: [...selectedIds] })

  const availableShifts = useMemo(() => {
    if (isHolidayOnly) return shifts.filter(s => s.is_status === 'active' && s.type === 'overtime')
    return shifts.filter(s => s.is_status === 'active')
  }, [shifts, isHolidayOnly])

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('reserves', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activePolicy
              ? `${t('reserves', 'policyLabel')} ${activePolicy.name_th} · ${activePolicy.companys?.name_th ?? ''}`
              : t('company', 'noPolicy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>{t('common', 'export')}</Button>
          {!isAutoMode && (
            <>
              <Button variant="secondary" size="sm" icon={<Users size={13} />} onClick={() => openModal('bulk-reserve', { company_id: currentCompanyId, policy_id: activePolicy?.id ?? '' })}>
                {t('reserves', 'groupBook')}
              </Button>
              <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openAddModal} disabled={!isAdminUser && afterCutoff && cutoffBlocks}>
                {!isAdminUser && afterCutoff && cutoffBlocks ? `${t('reserves', 'closedCutoff')} (${cutoff})` : t('reserves', 'newBook')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Policy Banner */}
      {activePolicy ? (
        <PolicyBanner policy={activePolicy} afterCutoff={afterCutoff} cutoffBlocks={cutoffBlocks} needsGAApproval={needsGAApproval} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3 text-xs text-slate-500">
          <ShieldCheck size={18} className="text-slate-300" />
          {t('reserves', 'noPolicy')} —{' '}
          <a href="/dashboard/booking-policies" className="text-sky-600 underline font-medium">{t('reserves', 'goPolicies')}</a>{' '}
          {t('reserves', 'toSetup')}
        </div>
      )}

      {/* State filter cards */}
      <div className="grid grid-cols-5 gap-3">
        {([
          { key: 'all', label: t('common', 'all'), c: 'bg-slate-50 border-slate-200', t2: 'text-slate-700' },
          { key: 'waiting', label: t('common', 'waiting'), c: 'bg-amber-50 border-amber-100', t2: 'text-amber-700' },
          { key: 'approved', label: t('common', 'approved'), c: 'bg-emerald-50 border-emerald-100', t2: 'text-emerald-700' },
          { key: 'canceled', label: t('common', 'cancelled'), c: 'bg-red-50 border-red-100', t2: 'text-red-600' },
          { key: 'finished', label: t('common', 'done'), c: 'bg-blue-50 border-blue-100', t2: 'text-blue-700' },
        ] as const).map(item => (
          <button
            key={item.key}
            onClick={() => { setStateFilter(item.key as ReserveStatus | 'all'); clearSelection() }}
            className={`rounded-xl p-4 border text-left transition-all ${item.c} ${stateFilter === item.key ? 'ring-2 ring-sky-300' : 'hover:opacity-80'}`}
          >
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.t2}`}>{counts[item.key]}</p>
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckSquare size={14} className="text-sky-600 flex-shrink-0" />
            <span className="text-xs font-bold text-sky-700">
              {t('reserves', 'selectedItems')} {selectedIds.size} {t('common', 'items')}
            </span>
            {selectedIds.size !== selectedInView.length && (
              <span className="text-[10px] text-sky-500">({selectedInView.length} {t('reserves', 'inPage')})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkEditShift} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-sky-300 hover:text-sky-700 transition-colors">
              <Pencil size={12} />{t('reserves', 'changeShift')}
            </button>
            <button onClick={handleBulkCancel} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              <Ban size={12} />{t('reserves', 'cancelSelected')}
            </button>
            <button onClick={clearSelection} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card padding="sm">
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-48">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full" placeholder={t('reserves', 'searchPlaceholder')} value={search} onChange={e => { setSearch(e.target.value); clearSelection() }} />
          </div>
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 bg-white">
            <span className="text-[10px] text-slate-400 shrink-0">ตั้งแต่</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); clearSelection() }}
              className="text-xs bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 bg-white">
            <span className="text-[10px] text-slate-400 shrink-0">ถึง</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); clearSelection() }}
              className="text-xs bg-transparent outline-none" />
          </div>
          <select className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none" value={shiftFilter} onChange={e => { setShiftFilter(e.target.value); clearSelection() }}>
            <option value="">{t('reserves', 'allShifts')}</option>
            {availableShifts.map(s => <option key={s.id} value={s.id}>{s.name_th}</option>)}
          </select>
        </div>

        <Table>
          <thead>
            <tr>
              <Th className="w-10">
                <button onClick={toggleAll} className="text-slate-400 hover:text-sky-600 transition-colors">
                  {allSelected ? <CheckSquare size={14} className="text-sky-600" /> : someSelected ? <MinusSquare size={14} className="text-sky-500" /> : <Square size={14} />}
                </button>
              </Th>
              <Th>{t('bookings', 'employee')}</Th>
              <Th>{t('common', 'shift')}</Th>
              <Th>{t('common', 'point')}</Th>
              <Th>{t('bookings', 'travelDate')}</Th>
              <Th>Platform</Th>
              <Th>{t('common', 'status')}</Th>
              <Th>{t('common', 'actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const isSelected = selectedIds.has(r.id)
              return (
                <tr key={r.id} className={`table-row-hover transition-colors ${isSelected ? 'bg-sky-50' : ''}`}>
                  <Td>
                    <button onClick={() => toggleRow(r.id)} className="text-slate-300 hover:text-sky-600 transition-colors">
                      {isSelected ? <CheckSquare size={14} className="text-sky-600" /> : <Square size={14} />}
                    </button>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-violet-600">{r.employee?.first_name_th.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{r.employee?.first_name_th} {r.employee?.last_name_th}</p>
                        <p className="text-[10px] font-mono text-slate-400">{r.employee?.code}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-xs text-slate-600">{r.shift?.name_th}</p>
                      <p className="text-[10px] font-mono text-slate-400">{r.shift?.default_time} {t('common', 'timeUnit')}</p>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-600">{r.point?.name_th ?? '-'}</span></Td>
                  <Td><span className="text-xs font-mono text-slate-600">{r.travel_date.slice(0, 10)}</span></Td>
                  <Td><span className="text-sm">{getPlatformIcon(r.platform)}</span></Td>
                  <Td><Badge variant={getReserveStatusVariant(r.is_state)}>{getReserveStatusLabel(r.is_state)}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openModal('view-reserve', r)} className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"><Eye size={13} /></button>
                      {r.is_state === 'waiting' && hasApproval && (
                        <>
                          <button onClick={() => updateReserveState(r.id, 'approved')} className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-semibold transition-colors">{t('common', 'approve')}</button>
                          <button onClick={() => updateReserveState(r.id, 'canceled')} className="text-[10px] px-2 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-semibold transition-colors">{t('common', 'reject')}</button>
                        </>
                      )}
                      {r.is_state === 'waiting' && !activePolicy && (
                        <>
                          <button onClick={() => updateReserveState(r.id, 'approved')} className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-semibold transition-colors">{t('common', 'approve')}</button>
                          <button onClick={() => updateReserveState(r.id, 'canceled')} className="text-[10px] px-2 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-semibold transition-colors">{t('common', 'cancel')}</button>
                        </>
                      )}
                      <button onClick={() => openModal('delete-reserve', r)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </Td>
                </tr>
              )
            })}
            {!filtered.length && (
              <tr><td colSpan={8} className="text-center py-10 text-xs text-slate-400">{t('common', 'noData')}</td></tr>
            )}
          </tbody>
        </Table>

        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>
            {t('reserves', 'showOf')} {filtered.length} {t('reserves', 'of')} {companyReserves.length} {t('common', 'items')}
            {selectedIds.size > 0 && <span className="ml-2 text-sky-600 font-medium">· {t('reserves', 'selectedItems')} {selectedIds.size}</span>}
          </span>
          {counts.waiting > 0 && hasApproval && (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle size={11} />{counts.waiting} {t('common', 'waiting')}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}

function PolicyBanner({ policy, afterCutoff, cutoffBlocks, needsGAApproval }: {
  policy: BookingPolicy; afterCutoff: boolean; cutoffBlocks: boolean; needsGAApproval: boolean
}) {
  const { t } = useLang()
  const r = policy.booking_policy_rules
  const isAuto = r?.booking_mode === 'assigned'

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className={`px-4 py-2.5 flex items-center justify-between ${isAuto ? 'bg-violet-50 border-b border-violet-100' : 'bg-sky-50 border-b border-sky-100'}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className={isAuto ? 'text-violet-500' : 'text-sky-500'} />
          <span className="text-xs font-bold text-slate-700">{policy.name_th}</span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[10px] text-slate-500">{policy.companys?.name_th}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isAuto ? 'info' : 'success'}>
            {isAuto ? t('reserves', 'autoMode') : t('reserves', 'manualMode')}
          </Badge>
          {afterCutoff && cutoffBlocks && <Badge variant="error">{t('reserves', 'closedCutoff')}</Badge>}
          {afterCutoff && needsGAApproval && <Badge variant="warning">{t('reserves', 'needApproval')}</Badge>}
        </div>
      </div>

      {r && (
        <div className="px-4 py-3 flex flex-wrap gap-x-6 gap-y-2">
          <RulePill icon={<CalendarCheck size={11} />} label="วันที่อนุญาต" value={getAllowDaysLabel(r.allow_days)} />
          <RulePill icon={<Clock size={11} />} label={t('reserves', 'cutoff')} value={`${r.cutoff_time} น.`} valueClass={afterCutoff ? (cutoffBlocks ? 'text-red-600' : 'text-amber-600') : 'text-slate-700'} />
          <RulePill icon={<ShieldCheck size={11} />} label={t('reserves', 'overCutoff')} value={getAfterCutoffLabel(r.after_cutoff_action)} />
          {r.ot_requires_approval && <RulePill icon={<AlertTriangle size={11} />} label={t('reserves', 'otWeekday')} value={t('reserves', 'needApproval')} valueClass="text-amber-600" />}
          {r.holiday_requires_approval && <RulePill icon={<AlertTriangle size={11} />} label={t('reserves', 'holiday')} value={t('reserves', 'needApproval')} valueClass="text-amber-600" />}
        </div>
      )}

      {afterCutoff && (
        <div className={`mx-4 mb-3 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 ${cutoffBlocks ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
          <AlertTriangle size={12} />
          {cutoffBlocks
            ? `${t('reserves', 'overCutoff')} ${r?.cutoff_time} น.`
            : t('reserves', 'closedInfo')}
        </div>
      )}

      {isAuto && (
        <div className="mx-4 mb-3 rounded-lg px-3 py-2 text-xs text-violet-700 bg-violet-50 border border-violet-100 flex items-center gap-1.5">
          <Clock size={12} />
          {t('reserves', 'autoCreated')}
        </div>
      )}
    </div>
  )
}

function RulePill({ icon, label, value, valueClass = 'text-slate-700' }: {
  icon: React.ReactNode; label: string; value: string; valueClass?: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-400">{label}:</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  )
}
