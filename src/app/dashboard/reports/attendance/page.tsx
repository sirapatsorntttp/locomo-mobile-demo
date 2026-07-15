'use client'
import { useState, useMemo, useEffect } from 'react'
import { CreditCard, Search, Download, CheckCircle2, XCircle, Wifi, QrCode } from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import { useAttendanceStore } from '@/lib/stores/attendance.store'

type StateFilter = 'all' | 'reserved' | 'not_reserved'
type TypeFilter  = 'all' | 'rfid' | 'qr_code'

export default function AttendanceReportPage() {
  const { attendances,loadAttendances } = useAttendanceStore()
  
  const { t } = useLang()

  const [search, setSearch]         = useState('')
  const [dateFrom, setDateFrom]     = useState('2026-04-01')
  const [dateTo, setDateTo]         = useState('2026-04-06')
  const [stateFilter, setState]     = useState<StateFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [routeFilter, setRouteFilter] = useState('')

  useEffect(()=>{
    loadAttendances()
  },[])
  const routes = useMemo(() => {
    const seen = new Set<string>()
    const list: { id: string; name: string }[] = []
    attendances.forEach(a => {
      const name = a.post?.route?.name_th
      const id = a.post?.route_id
      if (id && name && !seen.has(id)) { seen.add(id); list.push({ id, name }) }
    })
    return list
  }, [attendances])

  const filtered = useMemo(() => attendances.filter(a => {
    const q = `${a.employee?.first_name_th ?? ''} ${a.employee?.last_name_th ?? ''} ${a.rfid} ${a.post?.route?.name_th ?? ''} ${a.point?.name_th ?? ''}`.toLowerCase()
    if (!q.includes(search.toLowerCase())) return false
    if (stateFilter !== 'all' && a.is_state !== stateFilter) return false
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (routeFilter && a.post?.route_id !== routeFilter) return false
    return true
  }), [attendances, search, stateFilter, typeFilter, routeFilter])

  const stats = {
    total:       attendances.length,
    reserved:    attendances.filter(a => a.is_state === 'reserved').length,
    notReserved: attendances.filter(a => a.is_state === 'not_reserved').length,
    rfid:        attendances.filter(a => a.type === 'rfid').length,
    qr:          attendances.filter(a => a.type === 'gps').length,
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('reportAttendance', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('reportAttendance', 'subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none" />
          <span className="text-xs text-slate-400">{t('dashboard', 'to')}</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none" />
          <Button variant="primary" size="sm">{t('common', 'search')}</Button>
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>Excel</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: t('reportAttendance','totalScans'), value: stats.total,       color: 'bg-white border-slate-200',         text: 'text-slate-700' },
          { label: t('reportAttendance','withReserve'), value: stats.reserved,    color: 'bg-emerald-50 border-emerald-100',   text: 'text-emerald-700' },
          { label: t('reportAttendance','noReserve'),  value: stats.notReserved, color: 'bg-amber-50 border-amber-100',       text: 'text-amber-700' },
          { label: 'RFID',         value: stats.rfid,        color: 'bg-sky-50 border-sky-100',           text: 'text-sky-700' },
          { label: 'QR Code',      value: stats.qr,          color: 'bg-violet-50 border-violet-100',     text: 'text-violet-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-52">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
            placeholder={t('reportAttendance', 'searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          value={routeFilter}
          onChange={e => setRouteFilter(e.target.value)}
        >
          <option value="">{t('reportAttendance', 'allRoutes')}</option>
          {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          value={stateFilter}
          onChange={e => setState(e.target.value as StateFilter)}
        >
          <option value="all">{t('reportAttendance', 'allReserveStatuses')}</option>
          <option value="reserved">{t('reportAttendance', 'withReserve')}</option>
          <option value="not_reserved">{t('reportAttendance', 'noReserve')}</option>
        </select>
        <select
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">{t('reportAttendance', 'allScanTypes')}</option>
          <option value="rfid">RFID</option>
          <option value="qr_code">QR Code</option>
        </select>
        <p className="text-xs text-slate-400 ml-auto">{t('common', 'show')} {filtered.length} / {attendances.length} {t('common', 'items')}</p>
      </div>

      {/* Table */}
      <Card padding="sm">
        <Table>
          <thead>
            <tr>
              <Th>{t('common', 'employee')}</Th>
              <Th>RFID</Th>
              <Th>{t('reportAttendance', 'stopLabel')}</Th>
              <Th>{t('common', 'route')}</Th>
              <Th>Post</Th>
              <Th>{t('reportAttendance', 'scanType')}</Th>
              <Th>{t('reportAttendance', 'reserveStatus')}</Th>
              <Th>{t('reportAttendance', 'scanTime')}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const emp = a.employee
              return (
                <tr key={a.id} className="table-row-hover transition-colors">
                  <Td>
                    {emp ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                          {emp.first_name_th.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{emp.first_name_th} {emp.last_name_th}</p>
                          <p className="text-[10px] font-mono text-slate-400">{emp.code}</p>
                        </div>
                      </div>
                    ) : <span className="text-[10px] text-slate-300">-</span>}
                  </Td>
                  <Td>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{a.rfid}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600">{a.point?.name_th ?? '-'}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600">{a.post?.route?.name_th ?? '-'}</span>
                  </Td>
                  <Td>
                    <span className="text-xs font-mono text-slate-500">{a.post?.code ?? '-'}</span>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      a.type === 'rfid'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-violet-50 text-violet-700 border-violet-200'
                    }`}>
                      {a.type === 'rfid' ? <Wifi size={9} /> : <QrCode size={9} />}
                      {a.type === 'rfid' ? 'RFID' : 'QR Code'}
                    </span>
                  </Td>
                  <Td>
                    {a.is_state === 'reserved' ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <CheckCircle2 size={10} /> {t('reportAttendance', 'hasReserve')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                        <XCircle size={10} /> {t('reportAttendance', 'noReserveLabel')}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(a.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </Td>
                </tr>
              )
            })}
            {!filtered.length && (
              <tr><td colSpan={8} className="text-center py-10 text-xs text-slate-400">{t('common', 'noData')}</td></tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
