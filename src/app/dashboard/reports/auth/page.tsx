'use client'
import { useState, useEffect } from 'react'
import { Shield, Search, Download, CheckCircle, XCircle, LogIn, LogOut, RefreshCw } from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { formatDatetime, getPlatformIcon, getDeviceIcon } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { AuthenticationType, AuthenticationEvent } from '@/types'
import { useAuthStore } from '@/lib/stores/auth.store'

export default function AuthLogsPage() {
  const { authLogs, authLogsTotal, loadAuthLogs } = useAuthStore()
  const { t } = useLang()

  const today = new Date().toISOString().slice(0, 10)
  const sevenAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)

  const [search, setSearch] = useState('')
  const [resultFilter, setResultFilter] = useState<AuthenticationType | 'all'>('all')
  const [eventFilter, setEventFilter] = useState<AuthenticationEvent | 'all'>('all')
  const [dateFrom, setDateFrom] = useState(sevenAgo)
  const [dateTo, setDateTo] = useState(today)
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    await loadAuthLogs({
      result: resultFilter !== 'all' ? resultFilter : undefined,
      event: eventFilter !== 'all' ? eventFilter : undefined,
      dateFrom,
      dateTo,
    })
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = authLogs.filter(log => {
    if (!search) return true
    const q = `${log.users?.username ?? ''} ${log.ip ?? ''}`.toLowerCase()
    return q.includes(search.toLowerCase())
  })

  const counts = {
    total: authLogsTotal,
    success: authLogs.filter(l => l.result === 'success').length,
    failure: authLogs.filter(l => l.result === 'failure').length,
    login: authLogs.filter(l => l.event === 'login').length,
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('reportAuth', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('reportAuth', 'subtitle')} · {authLogsTotal} {t('common', 'items')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />} onClick={fetchLogs}>
            {t('common', 'refresh')}
          </Button>
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>{t('common', 'export')}</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('common', 'all'), value: counts.total, c: 'bg-slate-50 border-slate-200', t: 'text-slate-700', icon: <Shield size={18} className="text-slate-400" /> },
          { label: 'success', value: counts.success, c: 'bg-emerald-50 border-emerald-100', t: 'text-emerald-700', icon: <CheckCircle size={18} className="text-emerald-500" /> },
          { label: 'failure', value: counts.failure, c: 'bg-red-50 border-red-100', t: 'text-red-600', icon: <XCircle size={18} className="text-red-500" /> },
          { label: 'login events', value: counts.login, c: 'bg-sky-50 border-sky-100', t: 'text-sky-700', icon: <LogIn size={18} className="text-sky-500" /> },
        ].map(i => (
          <div key={i.label} className={`rounded-xl p-4 border flex items-center gap-3 ${i.c}`}>
            <div>{i.icon}</div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">{i.label}</p>
              <p className={`text-2xl font-bold ${i.t}`}>{i.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding="sm">
        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-48">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
              placeholder={t('reportAuth', 'searchPlaceholder')}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <input
            type="date" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          />
          <input
            type="date" value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          />
          <Button variant="primary" size="sm" onClick={fetchLogs}>{t('common', 'search')}</Button>

          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'success', 'failure'] as const).map(r => (
              <button key={r} onClick={() => setResultFilter(r)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${resultFilter === r ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>
                {r === 'all' ? t('reportAuth', 'allResults') : r === 'success' ? t('reportAuth', 'successFilter') : t('reportAuth', 'failureFilter')}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'login', 'logout'] as const).map(e => (
              <button key={e} onClick={() => setEventFilter(e)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${eventFilter === e ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>
                {e === 'all' ? t('reportAuth', 'allResults') : e}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>{t('reportAuth', 'username' as any)}</Th>
              <Th>{t('reportAuth', 'eventLabel')}</Th>
              <Th>{t('reportAuth', 'resultLabel')}</Th>
              <Th>IP</Th>
              <Th>{t('reportAuth', 'platformLabel')}</Th>
              <Th>{t('reportAuth', 'deviceLabel')}</Th>
              <Th>{t('common', 'note')}</Th>
              <Th>{t('reportAuth', 'timeLabel')}</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-10 text-xs text-slate-400">กำลังโหลด...</td></tr>
            )}
            {!loading && filtered.map(log => (
              <tr key={log.id} className="table-row-hover transition-colors">
                <Td>
                  {log.users ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center text-[9px] font-bold text-sky-600 flex-shrink-0">
                        {log.users.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-700">{log.users.username}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-mono">{log.user_id?.slice(0, 8) ?? '-'}</span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    {log.event === 'login' ? <LogIn size={13} className="text-sky-500" /> : <LogOut size={13} className="text-slate-400" />}
                    <span className="text-xs font-semibold text-slate-600">{log.event}</span>
                  </div>
                </Td>
                <Td>
                  <Badge variant={log.result === 'success' ? 'success' : 'error'}>
                    {log.result === 'success' ? `✓ ${t('reportAuth', 'success')}` : `✗ ${t('reportAuth', 'failure')}`}
                  </Badge>
                </Td>
                <Td><span className="font-mono text-xs text-slate-600">{log.ip ?? '-'}</span></Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{getPlatformIcon(log.platform)}</span>
                    <span className="text-xs text-slate-500">{log.platform}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{getDeviceIcon(log.device)}</span>
                    <span className="text-xs text-slate-500">{log.device}</span>
                  </div>
                </Td>
                <Td><span className="text-xs text-slate-400 max-w-[180px] truncate block">{log.remark ?? '-'}</span></Td>
                <Td><span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">{formatDatetime(log.created_at)}</span></Td>
              </tr>
            ))}
            {!loading && !filtered.length && (
              <tr><td colSpan={8} className="text-center py-10 text-xs text-slate-400">{t('reportAuth', 'notFound')}</td></tr>
            )}
          </tbody>
        </Table>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">{t('common', 'show')} {filtered.length} / {authLogsTotal} {t('common', 'items')}</p>
        </div>
      </Card>
    </div>
  )
}
