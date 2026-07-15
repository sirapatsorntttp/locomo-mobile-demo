'use client'
import { useEffect, useMemo, useState } from 'react'
import { Bus, Edit, Plus, Search, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { Badge, Button, Card, Table, Td, Th } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import type { VehicleType } from '@/types'
import { useVehiclesStore } from '@/lib/stores/useVehiclesStore'

type FormState = {
  id?: string
  name_th: string
  name_en: string
}

const emptyForm: FormState = { name_th: '', name_en: '' }

export default function VehicleTypesPage() {
  const { vehicleTypes, vehicles, loadVehicleTypes, addVehicleType, updateVehicleType, deleteVehicleType } = useVehiclesStore()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const usageByType = useMemo(() => {
    const map = new Map<string, number>()
    for (const vehicle of vehicles) {
      if (vehicle.is_status !== 'active') continue
      map.set(vehicle.vehicle_type_id, (map.get(vehicle.vehicle_type_id) ?? 0) + 1)
    }
    return map
  }, [vehicles])

  const filtered = vehicleTypes.filter(type => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return type.name_th.toLowerCase().includes(q) || type.name_en.toLowerCase().includes(q)
  })

  const activeCount = vehicleTypes.filter(type => type.is_status === 'active').length
  const inactiveCount = vehicleTypes.length - activeCount

  useEffect(() => { loadVehicleTypes() }, [loadVehicleTypes])

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name_th.trim()) next.name_th = 'กรุณากรอกชื่อภาษาไทย'
    if (!form.name_en.trim()) next.name_en = 'กรุณากรอกชื่อภาษาอังกฤษ'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const resetForm = () => {
    setForm(emptyForm)
    setErrors({})
  }

  const submit = () => {
    if (!validate()) return
    const payload = { name_th: form.name_th, name_en: form.name_en }
    if (form.id) updateVehicleType(form.id, payload)
    else addVehicleType(payload)
    resetForm()
  }

  const startEdit = (type: VehicleType) => {
    setForm({ id: type.id, name_th: type.name_th, name_en: type.name_en })
    setErrors({})
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">จัดการประเภทยานพาหนะ</h1>
          <p className="text-xs text-slate-400 mt-0.5">vehicle_types - ใช้เป็น master data สำหรับรถทุกคัน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">ทั้งหมด</p>
          <p className="text-2xl font-bold text-slate-700">{vehicleTypes.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-emerald-400 uppercase mb-1">ใช้งาน</p>
          <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-amber-400 uppercase mb-1">ปิดใช้งาน</p>
          <p className="text-2xl font-bold text-amber-700">{inactiveCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <Bus size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{form.id ? 'แก้ไขประเภท' : 'เพิ่มประเภทใหม่'}</h2>
              <p className="text-[10px] text-slate-400">name_th / name_en</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">ชื่อภาษาไทย</label>
              <input
                className={`w-full text-xs border rounded-xl px-3 py-2 bg-white outline-none ${errors.name_th ? 'border-red-300' : 'border-slate-200 focus:border-sky-300'}`}
                placeholder="เช่น รถตู้"
                value={form.name_th}
                onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
              />
              {errors.name_th && <p className="text-[10px] text-red-500 mt-1">{errors.name_th}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">ชื่อภาษาอังกฤษ</label>
              <input
                className={`w-full text-xs border rounded-xl px-3 py-2 bg-white outline-none ${errors.name_en ? 'border-red-300' : 'border-slate-200 focus:border-sky-300'}`}
                placeholder="เช่น Van"
                value={form.name_en}
                onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
              />
              {errors.name_en && <p className="text-[10px] text-red-500 mt-1">{errors.name_en}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              {form.id && (
                <Button variant="secondary" size="sm" icon={<X size={13} />} onClick={resetForm} className="flex-1">
                  ยกเลิก
                </Button>
              )}
              <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={submit} className="flex-1">
                {form.id ? 'บันทึก' : 'เพิ่มประเภท'}
              </Button>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <input
                className="text-xs bg-transparent outline-none text-slate-600 placeholder:text-slate-400 w-full"
                placeholder="ค้นหาชื่อประเภท..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <thead>
              <tr>
                <Th>ชื่อไทย</Th>
                <Th>English</Th>
                <Th>รถ active</Th>
                <Th>สถานะ</Th>
                <Th>จัดการ</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(type => {
                const usageCount = usageByType.get(type.id) ?? 0
                return (
                  <tr key={type.id} className="table-row-hover transition-colors">
                    <Td><span className="text-xs font-bold text-slate-700">{type.name_th}</span></Td>
                    <Td><span className="text-xs text-slate-500">{type.name_en}</span></Td>
                    <Td><Badge variant={usageCount > 0 ? 'info' : 'gray'}>{usageCount} คัน</Badge></Td>
                    <Td><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(type.is_status)}`}>{getStatusLabel(type.is_status)}</span></Td>
                    <Td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(type)}
                          className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => deleteVehicleType(type.id)}
                          className={`p-1 rounded-lg transition-colors ${type.is_status === 'active' ? 'text-emerald-500 hover:text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                          title={type.is_status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        >
                          {type.is_status === 'active' ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-xs text-slate-400 border-b border-slate-50">ไม่พบข้อมูล</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
