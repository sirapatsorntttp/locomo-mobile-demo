'use client'
import { useState, useMemo, useEffect } from 'react'
import { Bus, Download, Search, UserCheck, Map, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, Button, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useVehiclesStore } from '@/lib/stores/useVehiclesStore';
import { usePostStore } from '@/lib/stores/post.store'
import { useAttendanceStore } from '@/lib/stores/attendance.store'

export default function VehiclesReportPage() {
  const {  attendances,loadAttendances } = useAttendanceStore()
  const{posts,loadPost} = usePostStore()
  const { vehicles ,loadVehicles} = useVehiclesStore()
  const { driverVehicles, driverVehicleVendors,loadDriverVehicleVendors,loadDrivers } = useDriverStore()
  const { t } = useLang()
  const [search, setSearch] = useState('')
  useEffect(()=>{
    loadAttendances()
    loadPost()
    loadVehicles()
    loadDrivers()
    loadDriverVehicleVendors()
  },[])
  // Build per-vehicle stats
  const vehicleRows = useMemo(() => {
    return vehicles.map(v => {
      const dv = driverVehicles.find(d => d.vehicle_id === v.id)
      const dvv = dv ? driverVehicleVendors.find(d => d.driver_vehicle_id === dv.id) : undefined
      const driver = dv?.driver
      const vendor = dvv?.vendor

      // posts that use this vehicle (via dvv)
      const vPosts = dvv ? posts.filter(p => p.driver_vehicle_vendor_id === dvv.id) : []

      // attendances through those posts
      const postIds = new Set(vPosts.map(p => p.id))
      const vAttendances = attendances.filter(a => a.post_id && postIds.has(a.post_id))

      // unique routes served
      const routeNames = [...new Set(vPosts.map(p => p.route?.name_th).filter(Boolean))]

      return {
        vehicle: v,
        driver,
        vendor,
        postCount: vPosts.length,
        attendanceCount: vAttendances.length,
        routeNames,
        isAssigned: !!dv,
      }
    }).filter(row => {
      const q = `${row.vehicle.license} ${row.vehicle.code ?? ''} ${row.driver?.first_name_th ?? ''} ${row.driver?.last_name_th ?? ''} ${row.vendor?.name_th ?? ''}`.toLowerCase()
      return q.includes(search.toLowerCase())
    })
  }, [vehicles, driverVehicles, driverVehicleVendors, posts, attendances, search])

  const stats = {
    total: vehicles.length,
    assigned: vehicleRows.filter(r => r.isAssigned).length,
    unassigned: vehicleRows.filter(r => !r.isAssigned).length,
    totalPosts: vehicleRows.reduce((s, r) => s + r.postCount, 0),
    totalScans: vehicleRows.reduce((s, r) => s + r.attendanceCount, 0),
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('reportVehicles', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('reportVehicles', 'subtitle')} · Posts · {t('reportVehicles', 'scansCount')}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Download size={13} />}>Excel</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: t('reportVehicles', 'totalVehicles'), value: stats.total, color: 'bg-white border-slate-200', text: 'text-slate-700', icon: <Bus size={15} className="text-slate-400" /> },
          { label: t('reportVehicles', 'withDriver'), value: stats.assigned, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <UserCheck size={15} className="text-emerald-400" /> },
          { label: t('reportVehicles', 'noDriver'), value: stats.unassigned, color: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: <AlertTriangle size={15} className="text-amber-400" /> },
          { label: t('reportVehicles', 'totalPosts'), value: stats.totalPosts, color: 'bg-sky-50 border-sky-100', text: 'text-sky-700', icon: <Map size={15} className="text-sky-400" /> },
          { label: t('reportVehicles', 'totalScans'), value: stats.totalScans, color: 'bg-violet-50 border-violet-100', text: 'text-violet-700', icon: <TrendingUp size={15} className="text-violet-400" /> },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border flex items-center gap-3 ${s.color}`}>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 max-w-sm">
        <Search size={13} className="text-slate-400 flex-shrink-0" />
        <input
          className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
          placeholder={t('reportVehicles', 'searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card padding="sm">
        <Table>
          <thead>
            <tr>
              <Th>{t('reportVehicles', 'plate')}</Th>
              <Th>{t('reportVehicles', 'vehicleType')}</Th>
              <Th>{t('common', 'driver')}</Th>
              <Th>Vendor</Th>
              <Th>{t('reportVehicles', 'postsCount')}</Th>
              <Th>{t('reportVehicles', 'routeCount')}</Th>
              <Th>{t('reportVehicles', 'scansCount')}</Th>
              <Th>{t('common', 'status')}</Th>
            </tr>
          </thead>
          <tbody>
            {vehicleRows.map(row => {
              const { vehicle, driver, vendor } = row
              return (
                <tr key={vehicle.id} className="table-row-hover transition-colors">
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${row.isAssigned ? 'bg-emerald-100' : 'bg-slate-100'
                        }`}>
                        <Bus size={14} className={row.isAssigned ? 'text-emerald-600' : 'text-slate-400'} />
                      </div>
                      <div>
                        <p className="text-xs font-bold font-mono text-slate-700">{vehicle.license}</p>
                        <p className="text-[10px] text-slate-400">{vehicle.code ?? '-'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600">{(vehicle as any).vehicle_type?.name_th ?? '-'}</span>
                  </Td>
                  <Td>
                    {driver ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{driver.first_name_th} {driver.last_name_th}</p>
                        <p className="text-[10px] font-mono text-slate-400">{driver.code}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-medium">{t('reportVehicles', 'noDriver2')}</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600">{vendor?.name_th ?? '-'}</span>
                  </Td>
                  <Td>
                    <span className={`text-sm font-bold ${row.postCount > 0 ? 'text-sky-700' : 'text-slate-300'}`}>
                      {row.postCount}
                    </span>
                  </Td>
                  <Td>
                    {row.routeNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.routeNames.map(name => (
                          <span key={name} className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-full font-medium">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-[10px] text-slate-300">-</span>}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${Math.min(100, (row.attendanceCount / Math.max(1, stats.totalScans)) * 100 * (vehicles.length))}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${row.attendanceCount > 0 ? 'text-violet-700' : 'text-slate-300'}`}>
                        {row.attendanceCount}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(vehicle.is_status)}`}>
                      {getStatusLabel(vehicle.is_status)}
                    </span>
                  </Td>
                </tr>
              )
            })}
            {!vehicleRows.length && (
              <tr><td colSpan={8} className="text-center py-10 text-xs text-slate-400">{t('reportVehicles', 'notFound')}</td></tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
