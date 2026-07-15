'use client'
import { useState, useMemo, useEffect } from 'react'
import { Bus, Plus, Search, Edit, Trash2, UserCheck, AlertCircle } from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useVehiclesStore } from '@/lib/stores/useVehiclesStore'

export default function VehiclesPage() {
  const { openModal } = useStore()
  const { drivers, loadDrivers } = useDriverStore()
  const { vehicles, vehicleTypes, loadVehicles, loadVehicleTypes } = useVehiclesStore()
  const { t } = useLang()

  useEffect(() => { loadVehicles(); loadVehicleTypes(); loadDrivers() }, [])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const vehicleDriverMap = useMemo(() => {
    const map = new Map<string, typeof drivers[0]>()
    for (const d of drivers) {
      const vehicleId = (d.drivers_vehicles as any)?.vehicle_id
      if (vehicleId) map.set(vehicleId, d)
    }
    return map
  }, [drivers])

  const filtered = vehicles.filter(v =>
    (v.license.toLowerCase().includes(search.toLowerCase()) || v.code.toLowerCase().includes(search.toLowerCase())) &&
    (!typeFilter || v.vehicle_type_id === typeFilter)
  )

  const assignedCount = vehicles.filter(v => vehicleDriverMap.has(v.id)).length
  const freeCount = vehicles.filter(v => v.is_status === 'active' && !vehicleDriverMap.has(v.id)).length

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('vehicles', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">vehicles + vehicle_types · {vehicles.length} {t('fleet', 'vehicleCount')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-vehicle-type')}>ประเภทยานพาหนะ</Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-vehicle')}>{t('vehicles', 'addVehicle')}</Button>
        </div>
      </div>

      {/* Vehicle Types */}
      {vehicleTypes.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-700">ประเภทยานพาหนะ</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {vehicleTypes.map(vt => (
              <div key={vt.id} className="group flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <Bus size={13} className="text-sky-500" />
                <span className="font-semibold text-slate-700">{vt.name_th}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{vt.name_en}</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${getStatusColor(vt.is_status)}`}>{getStatusLabel(vt.is_status)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button onClick={() => openModal('edit-vehicle-type', vt)} className="p-0.5 text-slate-400 hover:text-amber-500 transition-colors"><Edit size={11} /></button>
                  <button onClick={() => openModal('delete-vehicle-type', vt)} className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{t('common', 'all')}</p>
          <p className="text-2xl font-bold text-slate-700">{vehicles.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-emerald-400 uppercase mb-1">{t('vehicles', 'hasDriver')}</p>
          <p className="text-2xl font-bold text-emerald-700">{assignedCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-amber-400 uppercase mb-1">{t('vehicles', 'noDriver')}</p>
          <p className="text-2xl font-bold text-amber-700">{freeCount}</p>
        </div>
        {vehicleTypes.filter(vt => vt.is_status === 'active').slice(0, 1).map(vt => (
          <div key={vt.id} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-blue-400 uppercase mb-1">{vt.name_th}</p>
            <div className="flex items-end gap-1">
              <p className="text-2xl font-bold text-blue-700">{vehicles.filter(v => v.vehicle_type_id === vt.id).length}</p>
              <p className="text-xs text-blue-400 mb-0.5">{t('vehicles', 'vehicleType')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vehicles.filter(v => v.is_status === 'active').slice(0, 6).map(v => {
          const drv = vehicleDriverMap.get(v.id)
          return (
            <div key={v.id} className="bg-white rounded-xl border border-slate-100 shadow-card p-5 hover:shadow-card-hover transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${drv ? 'bg-emerald-100' : 'bg-sky-100'}`}>
                    <Bus size={18} className={drv ? 'text-emerald-600' : 'text-sky-600'} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm font-mono">{v.license} {v.province}</p>
                    <p className="text-[10px] text-slate-400">{v.code}</p>
                  </div>
                </div>
                <Badge variant="info">{v.vehicle_type?.name_th}</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-3">{v.capacity ?? '-'} {t('vehicles', 'seats')} · {v.province}</p>
              {drv ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">{drv.first_name_th.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{drv.first_name_th} {drv.last_name_th}</p>
                    <p className="text-[10px] font-mono text-slate-400">{drv.code}</p>
                  </div>
                  <UserCheck size={12} className="text-emerald-500 flex-shrink-0" />
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 border-dashed px-2.5 py-2 mb-3">
                  <AlertCircle size={12} className="text-amber-400" />
                  <p className="text-xs text-amber-600">{t('vehicles', 'noDriverAssigned')}</p>
                </div>
              )}
              <div className="flex gap-2 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal('edit-vehicle', v)} className="flex-1 text-xs text-amber-600 hover:bg-amber-50 rounded-lg py-1.5 transition-colors font-semibold flex items-center justify-center gap-1"><Edit size={12} />{t('common', 'edit')}</button>
                <button onClick={() => openModal('delete-vehicle', v)} className="flex-1 text-xs text-red-500 hover:bg-red-50 rounded-lg py-1.5 transition-colors font-semibold flex items-center justify-center gap-1"><Trash2 size={12} />{t('common', 'delete')}</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <Card padding="sm">
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input className="text-xs bg-transparent outline-none text-slate-600 placeholder:text-slate-400 w-full" placeholder={t('vehicles', 'searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">{t('vehicles', 'allTypes')}</option>
            {vehicleTypes.filter(vt => vt.is_status === 'active').map(vt => <option key={vt.id} value={vt.id}>{vt.name_th}</option>)}
          </select>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>{t('common', 'code')}</Th>
              <Th>{t('vehicles', 'plate')}</Th>
              <Th>{t('vehicles', 'vehicleType')}</Th>
              <Th>{t('vehicles', 'seats')}</Th>
              <Th>{t('vehicles', 'driver')}</Th>
              <Th>{t('common', 'status')}</Th>
              <Th>{t('common', 'actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => {
              const drv = vehicleDriverMap.get(v.id)
              return (
                <tr key={v.id} className="table-row-hover transition-colors">
                  <Td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{v.code}</span></Td>
                  <Td><span className="font-mono text-xs font-bold text-slate-700">{v.license} {v.province}</span></Td>
                  <Td><Badge variant="info">{v.vehicle_type?.name_th ?? '-'}</Badge></Td>
                  <Td><span className="text-xs font-semibold">{v.capacity ?? '-'} {t('vehicles', 'seats')}</span></Td>
                  <Td>
                    {drv ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-[9px]">{drv.first_name_th.charAt(0)}</div>
                        <span className="text-xs text-slate-700">{drv.first_name_th} {drv.last_name_th}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-500 flex items-center gap-1"><AlertCircle size={10} />{t('vehicles', 'available')}</span>
                    )}
                  </Td>
                  <Td><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(v.is_status)}`}>{getStatusLabel(v.is_status)}</span></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openModal('edit-vehicle', v)} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit size={13} /></button>
                      <button onClick={() => openModal('delete-vehicle', v)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
