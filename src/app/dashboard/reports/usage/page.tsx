'use client'
import { useEffect, useState } from 'react'
import { Download, TrendingUp, Calendar } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'

import { useLang } from '@/lib/lang-context'
import UsageChart from '@/components/dashboard/UsageChart'
import { calcAttendanceRate } from '@/lib/utils'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useReserveStore } from '@/lib/stores/reserve.store'
import { useAttendanceStore } from '@/lib/stores/attendance.store'
import{useReportStore} from'@/lib/stores/report.store'
export default function UsageReportPage() {
  const {  getDashboardStats } = useStore()
  const{attendances,loadAttendances} = useAttendanceStore()
  const { reserves,loadReserves } = useReserveStore()
  const { employees } = useEmployeeStore()
  const{dailyUsage,loadDailyUsage} = useReportStore()
  const stats = getDashboardStats()
  const { t } = useLang()

  const [dateFrom, setDateFrom] = useState('2026-01-07')
  const [dateTo, setDateTo] = useState('2026-07-30')

   useEffect(() => {
    loadDailyUsage(dateFrom, dateTo)
    loadAttendances()
    loadReserves()
  }, [])
  // Build daily stats from store data + mock historical
  const liveStats = dailyUsage.map((d, i) => ({
    ...d,
    // Last day = live data from store
    reserves: i === dailyUsage.length - 1 ? reserves.length : d.reserves,
    attended: i === dailyUsage.length - 1 ? attendances.length : d.attended,
    not_attended: i === dailyUsage.length - 1 ? Math.max(0, reserves.length - attendances.length) : d.not_attended,
  }))

  const totalReserves = liveStats.reduce((s, d) => s + d.reserves, 0)
  const totalAttended = liveStats.reduce((s, d) => s + d.attended, 0)
  const totalNot = liveStats.reduce((s, d) => s + d.not_attended, 0)
  const avgRate = calcAttendanceRate(totalAttended, totalReserves)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('reportUsage', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('reportUsage', 'subtitle')} · {t('reports', 'liveData')}</p>
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

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('reportUsage', 'totalReserves'), value: totalReserves.toLocaleString(), sub: t('reportUsage', 'wholeWeek'), c: 'bg-violet-50 border-violet-100', t: 'text-violet-700', icon: '📋' },
          { label: t('reportUsage', 'actualBoarded'), value: totalAttended.toLocaleString(), sub: t('reportUsage', 'attendances'), c: 'bg-emerald-50 border-emerald-100', t: 'text-emerald-700', icon: '✅' },
          { label: t('reportUsage', 'noShow'), value: totalNot.toLocaleString(), sub: t('reportUsage', 'notAttended'), c: 'bg-red-50 border-red-100', t: 'text-red-600', icon: '❌' },
          { label: t('reportUsage', 'boardingRate'), value: `${avgRate}%`, sub: t('reportUsage', 'average'), c: 'bg-sky-50 border-sky-100', t: 'text-sky-700', icon: '📊' },
        ].map(i => (
          <div key={i.label} className={`rounded-xl p-5 border ${i.c} flex items-start justify-between`}>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{i.label}</p>
              <p className={`text-2xl font-bold ${i.t}`}>{i.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{i.sub}</p>
            </div>
            <span className="text-xl">{i.icon}</span>
          </div>
        ))}
      </div>

      {/* Live day stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('reportUsage', 'todayReserves'), value: reserves.length, c: 'bg-slate-50 border-slate-200', t: 'text-slate-700' },
          { label: t('reportUsage', 'todayAttended'), value: attendances.length, c: 'bg-emerald-50 border-emerald-100', t: 'text-emerald-700' },
          { label: t('reportUsage', 'todayWaiting'), value: reserves.filter(r => r.is_state === 'waiting').length, c: 'bg-amber-50 border-amber-100', t: 'text-amber-700' },
          { label: t('reportUsage', 'todayRate'), value: `${stats.usageRate}%`, c: 'bg-sky-50 border-sky-100', t: 'text-sky-700' },
        ].map(i => (
          <div key={i.label} className={`rounded-xl p-4 border ${i.c} flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{i.label}</p>
              <p className={`text-xl font-bold ${i.t}`}>{i.value}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Live
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('reportUsage', 'chartTitle')}</h2>
            <p className="text-xs text-slate-400">{t('reportUsage', 'chartSub')}</p>
          </div>
        </div>
        <UsageChart data={liveStats} />
      </Card>

      {/* Detail table */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800">{t('reportUsage', 'tableTitle')}</h2>
          <Button variant="secondary" size="sm" icon={<Download size={12} />}>{t('reports', 'downloadCsv')}</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {[t('common', 'date'), 'reserves', 'attended', 'not_attended', t('reportUsage', 'rateLabel'), t('common', 'status')].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 first:rounded-l-lg last:rounded-r-lg whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liveStats.map((row, i) => {
                const rate = calcAttendanceRate(row.attended, row.reserves)
                const isToday = i === liveStats.length - 1
                return (
                  <tr key={row.date} className={`table-row-hover transition-colors ${isToday ? 'bg-sky-50/50' : ''}`}>
                    <td className="px-4 py-3 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{row.date}</span>
                        {isToday && <span className="text-[9px] font-bold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-full border border-sky-200">LIVE</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-50 font-semibold text-violet-700">{row.reserves.toLocaleString()}</td>
                    <td className="px-4 py-3 border-b border-slate-50 font-semibold text-emerald-600">{row.attended.toLocaleString()}</td>
                    <td className="px-4 py-3 border-b border-slate-50 font-semibold text-red-500">{row.not_attended}</td>
                    <td className="px-4 py-3 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                          <div className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${rate}%` }} />
                        </div>
                        <span className="font-bold text-slate-600">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-50">
                      <Badge variant={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error'}>
                        {rate >= 80 ? t('reports', 'excellent') : rate >= 60 ? t('reports', 'moderate') : t('reports', 'low')}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {/* Totals row */}
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                <td className="px-4 py-3 text-slate-700 text-[11px] uppercase tracking-wide">{t('reports', 'total')}</td>
                <td className="px-4 py-3 text-violet-700">{totalReserves.toLocaleString()}</td>
                <td className="px-4 py-3 text-emerald-600">{totalAttended.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500">{totalNot}</td>
                <td className="px-4 py-3 text-slate-600">{avgRate}%</td>
                <td className="px-4 py-3">
                  <Badge variant={avgRate >= 80 ? 'success' : avgRate >= 60 ? 'warning' : 'error'}>
                    {avgRate >= 80 ? t('reports', 'excellent') : avgRate >= 60 ? t('reports', 'moderate') : t('reports', 'low')}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
