'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, Download, CreditCard, QrCode, Wifi, ScanLine } from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getAttendanceStatusLabel, getAttendanceTypeLabel, formatDatetime } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { AttendanceStatus, AttendanceType } from '@/types'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import { usePostStore } from '@/lib/stores/post.store'
import { useAttendanceStore } from '@/lib/stores/attendance.store'

const stateColors = {
  reserved: 'success' as const,
  not_reserved: 'warning' as const,
  not_found: 'gray' as const,
}

export default function AttendancesPage() {
  const {   scanAttendance } = useStore()
  const {attendances,loadAttendances} = useAttendanceStore()
  const{posts,loadPost} =usePostStore()
  const { points,loadRoutesPoints } = useRoutePointStore()
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<AttendanceStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<AttendanceType | 'all'>('all')
  const [scanRfid, setScanRfid] = useState('')
  const [scanPost, setScanPost] = useState(posts[0]?.id ?? '')
  const [scanPoint, setScanPoint] = useState(points[0]?.id ?? '')
  const [scanning, setScanning] = useState(false)
  const [lastScanOk, setLastScanOk] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = attendances.filter(a => {
    const q = `${a.employee?.first_name_th ?? ''} ${a.employee?.last_name_th ?? ''} ${a.rfid}`.toLowerCase()
    return q.includes(search.toLowerCase())
      && (stateFilter === 'all' || a.is_state === stateFilter)
      && (typeFilter === 'all' || a.type === typeFilter)
  })

  const handleScan = async () => {
    if (!scanRfid.trim()) return
    setScanning(true)
    await new Promise(r => setTimeout(r, 600))
    const ok = scanAttendance(scanRfid.trim(), scanPost, scanPoint, 'rfid')
    setLastScanOk(ok)
    setScanRfid('')
    setScanning(false)
    inputRef.current?.focus()
  }

  const stats = {
    total: attendances.length,
    reserved: attendances.filter(a => a.is_state === 'reserved').length,
    not_reserved: attendances.filter(a => a.is_state === 'not_reserved').length,
    rfid: attendances.filter(a => a.type === 'rfid').length,
  }
useEffect(()=>{
  loadPost()
  loadRoutesPoints()
loadAttendances()
},[])
  const selectedPost = posts.find(p => p.id === scanPost)
  const postPoints = selectedPost ? points.filter(p => p.route_id === selectedPost.route_id) : points

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('attendances', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('attendances', 'subtitle')}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Download size={13} />}>{t('common', 'export')}</Button>
      </div>

      {/* RFID Scanner */}
      <Card padding="md" className="border-sky-100 bg-gradient-to-r from-sky-50/50 to-blue-50/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('attendances', 'simulateScan')}</h2>
            <p className="text-xs text-slate-400">{t('attendances', 'scanHint')}</p>
          </div>
          {lastScanOk !== null && (
            <div className={`ml-auto flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl ${lastScanOk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {lastScanOk ? `✓ ${t('attendances', 'scanSuccess')}` : `✗ ${t('attendances', 'scanNotFound')}`}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">{t('attendances', 'rfidLabel')} *</label>
            <input
              ref={inputRef}
              type="text"
              className={`w-full text-sm border-2 rounded-xl px-4 py-2.5 outline-none font-mono transition-colors ${scanning ? 'border-sky-300 bg-sky-50' : lastScanOk === false ? 'border-red-300 bg-red-50' : 'border-sky-200 bg-white focus:border-sky-400'}`}
              placeholder={t('attendances', 'rfidPlaceholder')}
              value={scanRfid}
              onChange={e => { setScanRfid(e.target.value); setLastScanOk(null) }}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              disabled={scanning}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">{t('attendances', 'postLabel')} *</label>
            <select className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none" value={scanPost} onChange={e => setScanPost(e.target.value)}>
              {posts.map(p => <option key={p.id} value={p.id}>{p.code} · {p.route?.name_th} · {p.shift?.default_time}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">{t('attendances', 'pointLabel')} *</label>
            <select className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none" value={scanPoint} onChange={e => setScanPoint(e.target.value)}>
              {(postPoints.length > 0 ? postPoints : points).map(p => <option key={p.id} value={p.id}>{p.name_th} · {p.code}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="primary" size="sm" icon={<CreditCard size={13} />} onClick={handleScan} disabled={scanning || !scanRfid.trim()}>
            {scanning ? t('attendances', 'scanning') : t('attendances', 'scanBtn')}
          </Button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{t('attendances', 'tryWith')}</span>
            {['9309200001', '4520200002', '7484460004', '8584160003'].map(rfid => (
              <button key={rfid} onClick={() => setScanRfid(rfid)} className="font-mono text-sky-500 hover:text-sky-700 hover:underline transition-colors">{rfid}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <kbd className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-[10px] font-mono text-slate-500">Enter</kbd>
            <span className="text-[10px] text-slate-400">{t('attendances', 'quickScan')}</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('common', 'all'),                  value: stats.total,        c: 'bg-slate-50 border-slate-200',    tc: 'text-slate-700' },
          { label: t('attendances', 'hasReserve'),       value: stats.reserved,     c: 'bg-emerald-50 border-emerald-100', tc: 'text-emerald-700' },
          { label: t('attendances', 'noReserve'),        value: stats.not_reserved, c: 'bg-amber-50 border-amber-100',    tc: 'text-amber-700' },
          { label: 'RFID scan',                          value: stats.rfid,         c: 'bg-sky-50 border-sky-100',        tc: 'text-sky-700' },
        ].map(i => (
          <div key={i.label} className={`rounded-xl p-4 border ${i.c}`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{i.label}</p>
            <p className={`text-2xl font-bold ${i.tc}`}>{i.value}</p>
          </div>
        ))}
      </div>

      <Card padding="sm">
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-48">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full" placeholder={t('attendances', 'searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'reserved', 'not_reserved', 'not_found'] as const).map(s => (
              <button key={s} onClick={() => setStateFilter(s)} className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${stateFilter === s ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>
                {s === 'all' ? t('common', 'all') : s}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'rfid', 'gps'] as const).map(tp => (
              <button key={tp} onClick={() => setTypeFilter(tp)} className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${typeFilter === tp ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>
                {tp === 'all' ? t('common', 'all') : tp === 'rfid' ? '🪪 RFID' : '📱 QR'}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>RFID</Th><Th>{t('bookings', 'employee')}</Th><Th>{t('common', 'point')}</Th>
              <Th>Post</Th><Th>{t('reportAttendance', 'scanType')}</Th><Th>{t('attendances', 'isState')}</Th><Th>{t('common', 'time')}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="table-row-hover transition-colors">
                <Td><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-slate-700">{a.rfid}</span></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${a.is_state === 'reserved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {a.employee?.first_name_th.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{a.employee ? `${a.employee.first_name_th} ${a.employee.last_name_th}` : t('common', 'noData')}</p>
                      <p className="text-[10px] font-mono text-slate-400">{a.employee?.code}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div>
                    <p className="text-xs text-slate-600">{a.point?.name_th ?? '-'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{a.point?.code}</p>
                  </div>
                </Td>
                <Td>
                  <div>
                    <p className="text-xs font-mono text-slate-600">{a.post?.code ?? '-'}</p>
                    <p className="text-[10px] text-slate-400">{a.post?.route?.name_th}</p>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    {a.type === 'rfid' ? <CreditCard size={12} className="text-blue-500" /> : <QrCode size={12} className="text-violet-500" />}
                    <span className="text-xs text-slate-600">{getAttendanceTypeLabel(a.type)}</span>
                  </div>
                </Td>
                <Td><Badge variant={stateColors[a.is_state]}>{getAttendanceStatusLabel(a.is_state)}</Badge></Td>
                <Td><span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">{formatDatetime(a.created_at)}</span></Td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ScanLine size={28} className="opacity-30" />
                    <p className="text-xs">{t('attendances', 'noScans')} · {t('attendances', 'startHint')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">{t('reserves', 'showOf')} {filtered.length} {t('reserves', 'of')} {attendances.length} {t('common', 'items')}</p>
        </div>
      </Card>
    </div>
  )
}
