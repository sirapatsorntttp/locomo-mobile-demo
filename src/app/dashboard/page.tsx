'use client'
import { Users, Bus, Map, BookOpen, TrendingUp, Clock, Activity, Download, CalendarDays, UserCheck, Plus } from 'lucide-react'
import { StatCard, Card, SectionHeader, Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useVehiclesStore } from '@/lib/stores/useVehiclesStore'
import { useState, useEffect } from 'react'
// import { mockDailyUsage } from '@/lib/mock-data'
import { apiFetch } from '@/lib/api-fetch'
import { calcAttendanceRate, getReserveStatusVariant } from '@/lib/utils'
import EmployeeTable from '@/components/dashboard/EmployeeTable'
import UsageChart from '@/components/dashboard/UsageChart'
import VehicleTable from '@/components/dashboard/VehicleTable'
import ReservesTable from '@/components/dashboard/ReservesTable'
import AttendanceTable from '@/components/dashboard/AttendanceTable'
import { useLang } from '@/lib/lang-context'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useReserveStore } from '@/lib/stores/reserve.store'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import{useReportStore} from'@/lib/stores/report.store'

import { useAttendanceStore } from '@/lib/stores/attendance.store'

export default function DashboardPage() {
  const { openModal } = useStore()
  const { reserves,loadReserves } = useReserveStore()
  const { employees ,loadEmployees} = useEmployeeStore()
  const { drivers ,loadDriverVehicleVendors,loadDrivers} = useDriverStore()
  const { vehicles,loadVehicles ,loadVehicleTypes} = useVehiclesStore()
  const { routes ,loadRoutesPoints} = useRoutePointStore()
  const{dailyUsage,loadDailyUsage} =useReportStore()
  const {attendances,loadAttendances} = useAttendanceStore()
  const { t } = useLang()

  const activeEmployees = employees.filter(e => e.is_status === 'active').length
  const todayReserves = reserves.length
  const todayAttended = attendances.length
  const waitingReserves = reserves.filter(r => r.is_state === 'waiting').length
  const activeVehicles = vehicles.filter(v => v.is_status === 'active').length
  const usageRate = calcAttendanceRate(todayAttended, todayReserves)
  const notAttended = todayReserves - todayAttended

  const [dailyVehicles, setDailyVehicles] = useState<any[]>([])

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await apiFetch('/api/dashboard/daily-vehicles')
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            const arr = Array.isArray(json.data) ? json.data : (json.data?.data || [])
            setDailyVehicles(arr)
          }
        }
      } catch (e) {
        console.error('Failed to fetch daily vehicles', e)
      }
    }
    fetchVehicles()
  }, [])

  const reserveStatusLabel = (state: string) => {
    const map: Record<string, { th: string; en: string }> = {
      approved: { th: 'อนุมัติ', en: 'Approved' },
      waiting: { th: 'รอ', en: 'Waiting' },
      finished: { th: 'เสร็จ', en: 'Done' },
    }
    return map[state]
      ? (state === 'approved' ? t('common', 'approved') : state === 'waiting' ? t('common', 'waiting') : t('common', 'done'))
      : t('common', 'cancelled')
  }

  
const [fromDate, setFromDate] = useState('2026-04-01')
const [toDate, setToDate] = useState('2026-07-30')



 useEffect(() => {
    loadDailyUsage(fromDate, toDate)
    loadReserves()
    loadEmployees()
    loadDriverVehicleVendors()
    loadDrivers()
loadVehicles()
loadRoutesPoints()
loadVehicleTypes()
loadAttendances()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('dashboard', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('dashboard', 'subtitle')} · TTTP (Head Office)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="text-slate-400">{t('common', 'live')}</span>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-reserve')}>
            {t('dashboard', 'reservations')}
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard', 'activeUsers')} value={activeEmployees} subtitle={`${t('dashboard', 'outOfTotal')} ${employees.length}`} icon={<Users size={18} />} colorClass="stat-card-blue" iconBg="bg-blue-500" trend={{ value: 8, label: t('common', 'today') }} />
        <StatCard title={t('dashboard', 'todayBookings')} value={todayReserves} subtitle={`${t('dashboard', 'scanned')}: ${todayAttended}`} icon={<BookOpen size={18} />} colorClass="stat-card-violet" iconBg="bg-violet-500" />
        <StatCard title={t('dashboard', 'boardingRate')} value={`${usageRate}%`} subtitle={t('dashboard', 'ofBooked')} icon={<TrendingUp size={18} />} colorClass="stat-card-emerald" iconBg="bg-emerald-500" />
        <StatCard title={t('dashboard', 'pendingApproval')} value={waitingReserves} subtitle="reserves waiting" icon={<Clock size={18} />} colorClass="stat-card-amber" iconBg="bg-amber-500" />
        <StatCard title={t('dashboard', 'vehicles')} value={`${activeVehicles}/${vehicles.length}`} subtitle={t('dashboard', 'activeUnits')} icon={<Bus size={18} />} colorClass="stat-card-cyan" iconBg="bg-cyan-500" />
        <StatCard title={t('dashboard', 'drivers')} value={drivers.length} subtitle={t('dashboard', 'allDrivers')} icon={<UserCheck size={18} />} colorClass="stat-card-rose" iconBg="bg-rose-500" />
        <StatCard title={t('dashboard', 'routes')} value={routes.length} subtitle={t('dashboard', 'activeRoutes')} icon={<Map size={18} />} colorClass="stat-card-blue" iconBg="bg-indigo-500" />
        <StatCard title={t('dashboard', 'noShow')} value={notAttended} subtitle={t('dashboard', 'noShowToday')} icon={<CalendarDays size={18} />} colorClass="stat-card-amber" iconBg="bg-orange-500" />
      </div>

      {/* Employee table + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2" padding="sm">
          <SectionHeader
            icon={<Users size={14} />}
            title={t('dashboard', 'passengers')}
            subtitle={`${activeEmployees} ${t('dashboard', 'activePassengers')}`}
            iconBg="bg-sky-500"
            actions={
              <>
                <Button variant="secondary" size="sm">{t('common', 'viewAll')}</Button>
                <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => openModal('add-employee')}>{t('dashboard', 'addEmployee')}</Button>
              </>
            }
          />
          <EmployeeTable employees={employees.slice(0, 8)} />
        </Card>

        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Activity size={14} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{t('dashboard', 'todayStatus')}</h3>
                <p className="text-[10px] text-slate-400">{t('dashboard', 'statusSub')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: t('dashboard', 'boardedScan'), value: todayAttended, color: 'bg-emerald-500' },
                { label: t('dashboard', 'waitingState'), value: waitingReserves, color: 'bg-amber-400' },
                { label: t('dashboard', 'noShowCancel'), value: Math.max(0, notAttended - waitingReserves), color: 'bg-red-400' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-bold text-slate-700">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${todayReserves > 0 ? Math.min((item.value / todayReserves) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">{t('dashboard', 'recentBookings')}</h3>
              <Button variant="ghost" size="sm" onClick={() => openModal('add-reserve')} icon={<Plus size={12} />}>{t('dashboard', 'newBooking')}</Button>
            </div>
            <div className="space-y-2">
              {reserves.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-sky-600">
                    {r.employee?.first_name_th.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{r.employee?.first_name_th} {r.employee?.last_name_th}</p>
                    <p className="text-[10px] text-slate-400 truncate">{r.shift?.name_th} · {r.point?.name_th}</p>
                  </div>
                  <Badge variant={getReserveStatusVariant(r.is_state)}>
                    {r.is_state === 'approved' ? t('common', 'approved') : r.is_state === 'waiting' ? t('common', 'waiting') : r.is_state === 'finished' ? t('common', 'done') : t('common', 'cancelled')}
                  </Badge>
                </div>
              ))}
              {!reserves.length && <p className="text-xs text-center text-slate-400 py-4">{t('dashboard', 'noBookings')}</p>}
            </div>
          </Card>
        </div>
      </div>

      {/* Chart */}
      <Card padding="sm">
        <SectionHeader
          icon={<TrendingUp size={14} />}
          title={t('dashboard', 'chartTitle')}
          subtitle={t('dashboard', 'chartSub')}
          iconBg="bg-violet-500"
          actions={
            <>
              <input type="date" 
  value={fromDate}
  onChange={e => setFromDate(e.target.value)}
className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-sky-200" />
              <input type="date" 
value={toDate}
  onChange={e => setToDate(e.target.value)}
className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-sky-200" />
              <Button variant="primary" size="sm" onClick={() => loadDailyUsage(fromDate, toDate)}>{t('common', 'search')}</Button>
              <Button variant="secondary" size="sm" icon={<Download size={12} />}>{t('common', 'export')}</Button>
            </>
          }
        />
        <UsageChart data={dailyUsage} />
      </Card>

      {/* Reserves + Attendance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card padding="sm">
          <SectionHeader
            icon={<BookOpen size={14} />}
            title={t('dashboard', 'reserveList')}
            subtitle={`${reserves.length} ${t('common', 'items')}`}
            iconBg="bg-violet-500"
            actions={
              <>
                <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => openModal('add-reserve')}>{t('dashboard', 'newBooking')}</Button>
                <Button variant="secondary" size="sm" icon={<Download size={12} />}>{t('common', 'export')}</Button>
              </>
            }
          />
          <ReservesTable reserves={reserves.slice(0, 6)} />
        </Card>
        <Card padding="sm">
          <SectionHeader icon={<UserCheck size={14} />} title={t('dashboard', 'attendList')} subtitle={`${attendances.length} ${t('common', 'items')}`} iconBg="bg-emerald-500" actions={<Button variant="secondary" size="sm" icon={<Download size={12} />}>{t('common', 'export')}</Button>} />
          <AttendanceTable attendances={attendances.slice(0, 6)} />
        </Card>
      </div>

      {/* Vehicle */}
      <Card padding="sm">
        <SectionHeader icon={<Bus size={14} />} title={t('dashboard', 'vehicleSummary')} subtitle={t('dashboard', 'byVehicleType')} iconBg="bg-rose-500" actions={<Button variant="secondary" size="sm" icon={<Download size={12} />}>{t('common', 'export')}</Button>} />
        <VehicleTable data={dailyVehicles} />
      </Card>
    </div>
  )
}
