'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  BookOpen, CheckCircle2, XCircle, Clock, Search, Download,
  CalendarDays, MapPin, ChevronRight,
} from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getReserveStatusVariant, getReserveStatusLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { ReserveStatus } from '@/types'
import { useReserveStore } from '@/lib/stores/reserve.store'

type TabFilter = 'waiting' | 'approved' | 'all'

export default function BookingsPage() {
  const { openModal } = useStore()
  const { reserves, updateReserveState, bulkApprove,loadReserves } = useReserveStore()
  const { t } = useLang()

  const [tab, setTab] = useState<TabFilter>('waiting')
  const [search, setSearch] = useState('')
  const [dateFilter, setDate] = useState('')
  const [shiftFilter, setShift] = useState('')
  const [selectedIds, setSelected] = useState<Set<string>>(new Set())

  const shifts = useMemo(() => {
    const seen = new Map<string, string>()
    reserves.forEach(r => { if (r.shift_id && r.shift?.name_th) seen.set(r.shift_id, r.shift.name_th) })
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [reserves])

   useEffect(() => {
    loadReserves()
    }, [])

  const filtered = useMemo(() => reserves.filter(r => {
    const q = `${r.employee?.first_name_th ?? ''} ${r.employee?.last_name_th ?? ''} ${r.employee?.code ?? ''} ${r.point?.name_th ?? ''}`.toLowerCase()
    if (!q.includes(search.toLowerCase())) return false
    if (tab !== 'all' && r.is_state !== tab) return false
    if (dateFilter && !r.travel_date.startsWith(dateFilter)) return false
    if (shiftFilter && r.shift_id !== shiftFilter) return false
    return true
  }), [reserves, search, tab, dateFilter, shiftFilter])

  const waiting = reserves.filter(r => r.is_state === 'waiting').length
  const approved = reserves.filter(r => r.is_state === 'approved').length
  const finished = reserves.filter(r => r.is_state === 'finished').length
  const canceled = reserves.filter(r => r.is_state === 'canceled').length

  const allFilteredIds = filtered.map(r => r.id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id))
  const someSelected = allFilteredIds.some(id => selectedIds.has(id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); allFilteredIds.forEach(id => s.delete(id)); return s })
    } else {
      setSelected(prev => new Set([...prev, ...allFilteredIds]))
    }
  }
  const toggleOne = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const handleBulkApprove = () => {
    const ids = [...selectedIds].filter(id => reserves.find(r => r.id === id)?.is_state === 'waiting')
    if (ids.length) { bulkApprove(ids); setSelected(new Set()) }
  }

  const waitingSelected = [...selectedIds].filter(id => reserves.find(r => r.id === id)?.is_state === 'waiting').length

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('bookings', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('bookings', 'subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>{t('common', 'export')}</Button>
          <Button variant="primary" size="sm" icon={<BookOpen size={13} />} onClick={() => openModal('add-reserve')}>
            {t('dashboard', 'newBooking')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t('bookings', 'pending'), value: waiting, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Clock size={16} className="text-amber-400" />, dot: 'bg-amber-400' },
          { label: t('bookings', 'approved'), value: approved, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={16} className="text-emerald-400" />, dot: 'bg-emerald-400' },
          { label: t('bookings', 'done'), value: finished, color: 'bg-sky-50 border-sky-100', text: 'text-sky-700', icon: <CalendarDays size={16} className="text-sky-400" />, dot: 'bg-sky-400' },
          { label: t('bookings', 'cancelled'), value: canceled, color: 'bg-slate-50 border-slate-200', text: 'text-slate-500', icon: <XCircle size={16} className="text-slate-300" />, dot: 'bg-slate-300' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border flex items-center gap-3 ${s.color}`}>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">{s.icon}</div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            </div>
            {s.label === t('bookings', 'pending') && waiting > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot} inline-block`} />{t('common', 'live')}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center gap-0 border-b border-slate-200">
        {([
          { key: 'waiting', label: t('bookings', 'pending'), count: waiting, color: 'text-amber-600 border-amber-500' },
          { key: 'approved', label: t('bookings', 'approved'), count: approved, color: 'text-emerald-600 border-emerald-500' },
          { key: 'all', label: t('common', 'all'), count: reserves.length, color: 'text-sky-600 border-sky-500' },
        ] as { key: TabFilter; label: string; count: number; color: string }[]).map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => { setTab(tabItem.key); setSelected(new Set()) }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${tab === tabItem.key ? tabItem.color : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            {tabItem.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === tabItem.key ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
              }`}>{tabItem.count}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 mb-1">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search size={12} className="text-slate-400 flex-shrink-0" />
            <input
              className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-40"
              placeholder={t('bookings', 'searchPlaceholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(new Set()) }}
            />
          </div>
          <input type="date" value={dateFilter} onChange={e => { setDate(e.target.value); setSelected(new Set()) }} className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white outline-none" />
          <select className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white outline-none" value={shiftFilter} onChange={e => { setShift(e.target.value); setSelected(new Set()) }}>
            <option value="">{t('bookings', 'allShifts')}</option>
            {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-sky-600 text-white rounded-2xl px-4 py-3 shadow-lg">
          <span className="text-sm font-bold">{selectedIds.size} {t('bookings', 'selectedItems')}</span>
          {waitingSelected > 0 && (
            <Button variant="secondary" size="sm" icon={<CheckCircle2 size={13} />} onClick={handleBulkApprove} className="bg-white text-sky-700 hover:bg-sky-50 border-white">
              {t('bookings', 'approveSelected')} {waitingSelected}
            </Button>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sky-200 hover:text-white text-xs underline">
            {t('bookings', 'cancelSelected')}
          </button>
        </div>
      )}

      {/* Table */}
      <Card padding="sm">
        <Table>
          <thead>
            <tr>
              <Th><input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected }} onChange={toggleAll} className="rounded" /></Th>
              <Th>{t('bookings', 'employee')}</Th>
              <Th>{t('bookings', 'travelDate')}</Th>
              <Th>{t('bookings', 'shiftTime')}</Th>
              <Th>{t('bookings', 'pickupPoint')}</Th>
              <Th>Platform</Th>
              <Th>{t('common', 'status')}</Th>
              <Th>{t('common', 'actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const emp = r.employee
              const isSelected = selectedIds.has(r.id)
              return (
                <tr key={r.id} className={`transition-colors ${isSelected ? 'bg-sky-50' : 'table-row-hover'}`}>
                  <Td><input type="checkbox" checked={isSelected} onChange={() => toggleOne(r.id)} className="rounded" /></Td>
                  <Td>
                    {emp ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">{emp.first_name_th.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{emp.first_name_th} {emp.last_name_th}</p>
                          <p className="text-[10px] font-mono text-slate-400">{emp.code}</p>
                        </div>
                      </div>
                    ) : <span className="text-[10px] text-slate-300">-</span>}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 text-xs text-slate-700">
                      <CalendarDays size={11} className="text-slate-400 flex-shrink-0" />
                      {new Date(r.travel_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{r.shift?.name_th ?? '-'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{r.shift?.default_time}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <MapPin size={10} className="text-slate-400 flex-shrink-0" />
                      {r.point?.name_th ?? '-'}
                    </div>
                  </Td>
                  <Td><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{r.platform}/{r.device}</span></Td>
                  <Td><Badge variant={getReserveStatusVariant(r.is_state)}>{getReserveStatusLabel(r.is_state)}</Badge></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      {r.is_state === 'waiting' && (
                        <>
                          <button onClick={() => updateReserveState(r.id, 'approved')} className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                            <CheckCircle2 size={10} /> {t('common', 'approve')}
                          </button>
                          <button onClick={() => updateReserveState(r.id, 'canceled')} className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                            <XCircle size={10} /> {t('common', 'reject')}
                          </button>
                        </>
                      )}
                      {r.is_state === 'approved' && (
                        <button onClick={() => updateReserveState(r.id, 'canceled')} className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <XCircle size={10} /> {t('common', 'cancel')}
                        </button>
                      )}
                      <button onClick={() => openModal('view-reserve', r)} className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <CheckCircle2 size={28} className="mx-auto text-emerald-300 mb-2" />
                  <p className="text-xs text-slate-400">
                    {tab === 'waiting' ? t('bookings', 'noItems') : t('bookings', 'notFound')}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
