'use client'
import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select, FormGrid, FormSection, Textarea } from '@/components/ui/FormFields'
import { Button } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/stores/useVendorStore'
import { useVehiclesStore } from '@/lib/stores/useVehiclesStore'
import { useCalendarStore } from '@/lib/stores/useCalendarStore'
import { useCoordinatorStore } from '@/lib/stores/useCoordinatorStore'
import type { Vehicle, VehicleType, Driver, Shift, ShiftGroup, Calendar, Company, CompanyType, Plant, Coordinator, CoordinatorType } from '@/types'
import { Bus, UserCheck, Building2, ArrowRight, AlertTriangle, Settings, MapPin, Users } from 'lucide-react'
import { getCompanyPlantId,getProfile } from '@/lib/auth-token'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useCompanyStore } from '@/lib/stores/company.store'
import { usePlantStore } from '@/lib/stores/plant.store'
import { useShiftGroupStore } from '@/lib/stores/shiftGroup.store'
import { useShiftStore } from '@/lib/stores/shift.store'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (value: string) => uuidPattern.test(value)
const isActiveStatus = (value: unknown) => {
  const status = String(value ?? 'active').toLowerCase()
  return status !== 'inactive' && status !== 'false' && status !== '0'
}

// ═══════════════════════════════════════
// VEHICLE MODALS
// ═══════════════════════════════════════

export function AddVehicleModal() {
  const { modal, closeModal } = useStore()
  const { addVehicle, vehicleTypes, loadVehicleTypes } = useVehiclesStore()
  const open = modal.type === 'add-vehicle'
  const activeVehicleTypes = useMemo(
    () => vehicleTypes.filter(vt => isActiveStatus(vt.is_status) && isUuid(vt.id)),
    [vehicleTypes],
  )
  const [form, setForm] = useState({ code: '', license: '', province: '', capacity: 0, vehicle_type_id: activeVehicleTypes[0]?.id ?? '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) loadVehicleTypes()
  }, [open, loadVehicleTypes])

  useEffect(() => {
    if (!open) return
    if ((!form.vehicle_type_id || !isUuid(form.vehicle_type_id)) && activeVehicleTypes[0]?.id) {
      setForm(f => ({ ...f, vehicle_type_id: activeVehicleTypes[0].id }))
    }
  }, [open, form.vehicle_type_id, activeVehicleTypes])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'กรุณากรอกรหัส'
    if (!form.license.trim()) e.license = 'กรุณากรอกทะเบียน'
    if (!form.vehicle_type_id || !isUuid(form.vehicle_type_id)) e.vehicle_type_id = 'กรุณาเลือกประเภทยานพาหนะจากข้อมูลจริง'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    addVehicle({ ...form, capacity: Number(form.capacity) || null, vehicle_type_id: form.vehicle_type_id })
    setForm({ code: '', license: '', province: '', capacity: 0, vehicle_type_id: activeVehicleTypes[0]?.id ?? '' })
    setErrors({})
  }

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const goToVehicleTypes = () => {
    closeModal()
    window.location.href = '/dashboard/vehicle-types'
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มยานพาหนะ" subtitle="vehicles table" size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!activeVehicleTypes.length}>บันทึกยานพาหนะ</Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัสยานพาหนะ (code)" required error={errors.code}>
            <Input placeholder="เช่น VEH-007" value={form.code} onChange={e => s('code', e.target.value)} error={!!errors.code} />
          </Field>
          <Field label="ทะเบียน (license)" required error={errors.license}>
            <Input placeholder="เช่น กข-1234 กรุงเทพฯ" value={form.license} onChange={e => s('license', e.target.value)} error={!!errors.license} />
          </Field>
          <Field label="จังหวัด (province)">
            <Input placeholder="เช่น กรุงเทพฯ" value={form.province} onChange={e => s('province', e.target.value)} />
          </Field>
          <Field label="ความจุ (capacity)">
            <Input type="number" min={0} placeholder="12" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} />
          </Field>
        </FormGrid>
        <Field label="ประเภทยานพาหนะ (vehicle_type)" required>
          <Select
            value={form.vehicle_type_id}
            onChange={e => s('vehicle_type_id', e.target.value)}
            disabled={!activeVehicleTypes.length}
          >
            <option value="">-- เลือกประเภท --</option>
            {activeVehicleTypes.map(vt => (
              <option key={vt.id} value={vt.id}>{vt.name_th}</option>
            ))}
          </Select>
          {errors.vehicle_type_id && <p className="text-[10px] text-red-500 mt-1">{errors.vehicle_type_id}</p>}
        </Field>
        {!activeVehicleTypes.length && (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-xs text-amber-800 flex items-center justify-between gap-3">
            <span>ยังไม่มีประเภทยานพาหนะที่เปิดใช้งาน</span>
            <Button variant="secondary" size="sm" icon={<Settings size={13} />} onClick={goToVehicleTypes}>
              จัดการประเภท
            </Button>
          </div>
        )}
        {/* Preview selected type */}
        {form.vehicle_type_id && (
          <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 text-xs">
            {(() => {
              const vt = activeVehicleTypes.find(v => v.id === form.vehicle_type_id)
              return vt ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm">🚌</div>
                  <div>
                    <p className="font-semibold text-sky-800">{vt.name_th}</p>
                    <p className="text-sky-600">vehicle_types</p>
                  </div>
                </div>
              ) : null
            })()}
          </div>
        )}
      </div>
    </Modal>
  )
}

export function EditVehicleModal() {
  const { modal, closeModal } = useStore()
  const { updateVehicle, vehicleTypes, loadVehicleTypes } = useVehiclesStore()
  const open = modal.type === 'edit-vehicle'
  const veh: Vehicle | undefined = modal.data
  const activeVehicleTypes = useMemo(
    () => vehicleTypes.filter(vt => isUuid(vt.id) && (isActiveStatus(vt.is_status) || vt.id === veh?.vehicle_type_id)),
    [vehicleTypes, veh?.vehicle_type_id],
  )
  const [form, setForm] = useState({
    code: veh?.code ?? '',
    license: veh?.license ?? '',
    province: veh?.province ?? '',
    capacity: veh?.capacity ?? 0,
    vehicle_type_id: veh?.vehicle_type_id ?? '',
  })

  useEffect(() => {
    if (open) loadVehicleTypes()
  }, [open, loadVehicleTypes])

  useEffect(() => {
    if (!open || !veh) return
    const nextVehicleTypeId = isUuid(veh.vehicle_type_id)
      ? veh.vehicle_type_id
      : activeVehicleTypes[0]?.id ?? ''
    setForm({
      code: veh.code,
      license: veh.license,
      province: veh.province,
      capacity: veh.capacity ?? 0,
      vehicle_type_id: nextVehicleTypeId,
    })
  }, [open, veh, activeVehicleTypes])

  if (!veh || !open) return null

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const handleSubmit = () => {
    if (!isUuid(form.vehicle_type_id)) return
    updateVehicle(veh.id, { ...form, capacity: Number(form.capacity) || null })
  }

  return (
    <Modal open={open} onClose={closeModal} title={`แก้ไขรถ · ${veh.license}`} size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัสรถ"><Input value={form.code} onChange={e => s('code', e.target.value)} /></Field>
          <Field label="ทะเบียน"><Input value={form.license} onChange={e => s('license', e.target.value)} /></Field>
          <Field label="จังหวัด"><Input value={form.province} onChange={e => s('province', e.target.value)} /></Field>
          <Field label="ความจุ"><Input type="number" min={0} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} /></Field>
        </FormGrid>
        <Field label="ประเภทยานพาหนะ">
          <Select value={form.vehicle_type_id} onChange={e => s('vehicle_type_id', e.target.value)}>
            <option value="">-- เลือกประเภท --</option>
            {activeVehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name_th}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

export function DeleteVehicleModal() {
  const { modal, closeModal } = useStore()
  const { deleteVehicle } = useVehiclesStore()
  const open = modal.type === 'delete-vehicle'
  const veh: Vehicle | undefined = modal.data
  if (!veh || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบยานพาหนะ" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteVehicle(veh.id)}>ลบยานพาหนะ</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🚌</div>
        <p className="font-bold text-slate-800 text-base font-mono">{veh.license}</p>
        <p className="text-xs text-slate-400 mt-1">{veh.vehicle_type?.name_th} · {veh.code}</p>
        <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">จะเปลี่ยนสถานะเป็น inactive</p>
      </div>
    </Modal>
  )
}

export function AddVehicleTypeModal() {
  const { modal, closeModal } = useStore()
  const { addVehicleType } = useVehiclesStore()
  const open = modal.type === 'add-vehicle-type'
  const [form, setForm] = useState({ name_th: '', name_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) { setForm({ name_th: '', name_en: '' }); setErrors({}) }
  }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อภาษาไทย'
    if (!form.name_en.trim()) e.name_en = 'กรุณากรอกชื่อภาษาอังกฤษ'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    addVehicleType({ name_th: form.name_th.trim(), name_en: form.name_en.trim() })
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มประเภทยานพาหนะ" subtitle="vehicle_types table" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        <Field label="ชื่อภาษาไทย (name_th)" required error={errors.name_th}>
          <Input
            placeholder="เช่น รถมินิบัส"
            value={form.name_th}
            onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
            error={!!errors.name_th}
          />
        </Field>
        <Field label="ชื่อภาษาอังกฤษ (name_en)" required error={errors.name_en}>
          <Input
            placeholder="e.g. Minibus"
            value={form.name_en}
            onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
            error={!!errors.name_en}
          />
        </Field>
        {form.name_th && form.name_en && (
          <div className="flex items-center gap-3 bg-sky-50 rounded-xl p-3 border border-sky-100">
            <div className="w-8 h-8 rounded-lg bg-sky-200 flex items-center justify-center text-sky-700 text-sm">🚌</div>
            <div>
              <p className="text-xs font-bold text-sky-800">{form.name_th}</p>
              <p className="text-[10px] text-sky-500">{form.name_en}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export function EditVehicleTypeModal() {
  const { modal, closeModal } = useStore()
  const { updateVehicleType } = useVehiclesStore()
  const open = modal.type === 'edit-vehicle-type'
  const vt: VehicleType | undefined = modal.data
  const [form, setForm] = useState({ name_th: '', name_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && vt) { setForm({ name_th: vt.name_th, name_en: vt.name_en }); setErrors({}) }
  }, [open, vt])

  if (!vt || !open) return null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อภาษาไทย'
    if (!form.name_en.trim()) e.name_en = 'กรุณากรอกชื่อภาษาอังกฤษ'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    updateVehicleType(vt.id, { name_th: form.name_th.trim(), name_en: form.name_en.trim() })
  }

  return (
    <Modal open={open} onClose={closeModal} title={`แก้ไขประเภท · ${vt.name_th}`} subtitle="vehicle_types table" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        <Field label="ชื่อภาษาไทย (name_th)" required error={errors.name_th}>
          <Input
            value={form.name_th}
            onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
            error={!!errors.name_th}
          />
        </Field>
        <Field label="ชื่อภาษาอังกฤษ (name_en)" required error={errors.name_en}>
          <Input
            value={form.name_en}
            onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
            error={!!errors.name_en}
          />
        </Field>
      </div>
    </Modal>
  )
}

export function DeleteVehicleTypeModal() {
  const { modal, closeModal } = useStore()
  const { deleteVehicleType } = useVehiclesStore()
  const open = modal.type === 'delete-vehicle-type'
  const vt: VehicleType | undefined = modal.data
  if (!vt || !open) return null

  const isActive = vt.is_status === 'active'

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={isActive ? 'ปิดใช้งานประเภทยานพาหนะ' : 'เปิดใช้งานประเภทยานพาหนะ'}
      size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant={isActive ? 'danger' : 'primary'} size="sm" onClick={() => deleteVehicleType(vt.id)}>
          {isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
        </Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🚌</div>
        <p className="font-bold text-slate-800 text-base">{vt.name_th}</p>
        <p className="text-xs text-slate-400 mt-1">{vt.name_en}</p>
        {isActive ? (
          <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">
            จะเปลี่ยนสถานะเป็น inactive — ยานพาหนะที่ใช้ประเภทนี้จะยังคงอยู่
          </p>
        ) : (
          <p className="text-xs text-emerald-700 mt-4 bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            จะเปิดใช้งานประเภทนี้อีกครั้ง
          </p>
        )}
      </div>
    </Modal>
  )
}

export function AssignDriverVehicleModal() {
  const { modal, closeModal } = useStore()
  const {drivers, assignDriverVehicle}=useDriverStore()
  const { vehicles, loadVehicles } = useVehiclesStore()
  const { vendors, loadVendors } = useVendorStore()
  const open = modal.type === 'assign-driver-vehicle'
  const driver: Driver | undefined = modal.data

  const [vehicleId, setVehicleId] = useState('')
  const [vendorId, setVendorId]   = useState('')

  const currentDV  = driver?.drivers_vehicles ?? null
  const currentVendorId = (currentDV as any)?.vendors_drivers_vehicles?.vendor_id ?? ''

  useEffect(() => {
    if (!open) return
    loadVehicles()
    loadVendors()
    setVehicleId((currentDV as any)?.vehicle_id ?? '')
    setVendorId(currentVendorId)
  }, [open, driver?.id])

  if (!driver || !open) return null

  // Vehicles taken by OTHER drivers (derived from drivers list)
  const takenVehicleIds = new Set(
    drivers
      .filter(d => d.id !== driver.id && d.drivers_vehicles)
      .map(d => (d.drivers_vehicles as any)?.vehicle_id)
      .filter(Boolean)
  )

  const activeVehicles = vehicles.filter(v => v.is_status === 'active')
  const activeVendors  = vendors.filter(v => v.is_status === 'active')

  const selectedVehicle = activeVehicles.find(v => v.id === vehicleId)
  const selectedVendor  = activeVendors.find(v => v.id === vendorId)
  const isTaken = vehicleId ? takenVehicleIds.has(vehicleId) : false

  const canSave = vehicleId && vendorId && !isTaken

  return (
    <Modal open={open} onClose={closeModal} title="กำหนดรถให้คนขับ" size="md">
      <div className="space-y-4">

        {/* Driver info */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {driver.first_name_th.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{driver.first_name_th} {driver.last_name_th}</p>
            <p className="text-[10px] font-mono text-slate-400">{driver.code} · {driver.tel}</p>
          </div>
          {currentDV && (
            <div className="ml-auto text-right">
              <p className="text-[10px] text-slate-400">ปัจจุบัน</p>
              <p className="text-xs font-bold font-mono text-slate-600">{(currentDV as any)?.vehicles?.license}</p>
              <p className="text-[10px] text-slate-400">{(currentDV as any)?.vendors_drivers_vehicles?.vendors?.name_th}</p>
            </div>
          )}
        </div>

        {/* Vehicle picker */}
        <Field label="เลือกรถ (vehicle)" required>
          <Select value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
            <option value="">— เลือกรถ —</option>
            {activeVehicles.map(v => {
              const taken = takenVehicleIds.has(v.id)
              return (
                <option key={v.id} value={v.id} disabled={taken}>
                  {v.license} · {v.province} · {v.vehicle_type?.name_th} · {v.capacity ?? '-'} ที่นั่ง{taken ? ' (ใช้งานแล้ว)' : ''}
                </option>
              )
            })}
          </Select>
        </Field>

        {/* Taken warning */}
        {isTaken && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle size={13} />
            รถคันนี้ถูกกำหนดให้คนขับคนอื่นแล้ว กรุณาเลือกรถที่ว่างอยู่
          </div>
        )}

        {/* Vendor picker */}
        <Field label="Vendor (บริษัทรถ)" required>
          <Select value={vendorId} onChange={e => setVendorId(e.target.value)}>
            <option value="">— เลือก Vendor —</option>
            {activeVendors.map(v => (
              <option key={v.id} value={v.id}>{v.name_th} ({v.code})</option>
            ))}
          </Select>
        </Field>

        {/* Preview chain */}
        {selectedVehicle && selectedVendor && (
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3.5">
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mb-3">Chain ที่จะบันทึก</p>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
                <UserCheck size={12} className="text-sky-500" />
                <span className="font-semibold text-slate-700">{driver.first_name_th}</span>
              </div>
              <ArrowRight size={12} className="text-slate-400" />
              <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
                <Bus size={12} className="text-emerald-500" />
                <span className="font-semibold text-slate-700 font-mono">{selectedVehicle.license}</span>
                <span className="text-[10px] text-slate-400">{selectedVehicle.vehicle_type?.name_th}</span>
              </div>
              <ArrowRight size={12} className="text-slate-400" />
              <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
                <Building2 size={12} className="text-violet-500" />
                <span className="font-semibold text-slate-700">{selectedVendor.name_th}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={closeModal} className="flex-1">ยกเลิก</Button>
          <Button
            variant="primary" size="sm"
            onClick={() => assignDriverVehicle(driver.id, vehicleId, vendorId)}
            disabled={!canSave}
            className="flex-1"
          >
            {currentDV ? 'เปลี่ยนการกำหนด' : 'กำหนดรถ'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// SHIFT MODALS
// ═══════════════════════════════════════

export function AddShiftModal() {
  const { modal,
    closeModal,
  
    
    
    currentCompanyId,
    selectedCompanyPlantId,
    setSelectedCompanyPlantId,
     } = useStore()

     const{addShift} = useShiftStore()
     const { shiftGroups} = useShiftGroupStore()

    const {companyPlants,
    companies,loadCompanies} = useCompanyStore()
  const open = modal.type === 'add-shift'
   const profile = getProfile()

     const canSelectPlant =
    profile?.roleTypes?.includes('superadmin') ||
    profile?.roleTypes?.includes('admin')

  const availableCompanyPlants = companyPlants.filter((cp: any) =>
  currentCompanyId ? cp.company_id === currentCompanyId : true
)


  
  const [form, setForm] = useState({
  code: '',
  name_th: '',
  name_en: '',
  type: 'regular' as 'regular' | 'overtime',
  schedule: 'day' as 'day' | 'night',
  shift_group_id: '' as string | null,
  default_time: '07:00',
  company_plant_id: selectedCompanyPlantId || '',
})

  const [errors, setErrors] = useState<Record<string, string>>({})
useEffect(() => {
  if (!open) return

  loadCompanies()

  setForm({
    code: '',
    name_th: '',
    name_en: '',
    type: 'regular',
    schedule: 'day',
    shift_group_id: '',
    default_time: '07:00',
    company_plant_id: selectedCompanyPlantId || '',
  })

  setErrors({})
}, [open, selectedCompanyPlantId])

   const validate = () => {
    const e: Record<string, string> = {}

    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'

    if (canSelectPlant && !(form.company_plant_id || selectedCompanyPlantId)) {
      e.company_plant_id = 'กรุณาเลือก Plant'
    }

    setErrors(e)
    return !Object.keys(e).length
  }

  const s = (k: string, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!validate()) return

    addShift({
      ...form,
      company_plant_id:
        form.company_plant_id ||
        selectedCompanyPlantId ||
        getCompanyPlantId(),
      shift_group_id: form.shift_group_id || null,
    } as any)
  }


  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มกะใหม่" subtitle="shifts table" size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => { if (validate()) addShift({ ...form, shift_group_id: form.shift_group_id || null, company_plant_id: form.company_plant_id }) }}>บันทึกกะ</Button>
      </>}
    >
      <div className="space-y-4">

           <Field label="บริษัท / Plant" required error={errors.company_plant_id}>
        <Select
  value={form.company_plant_id ?? ''}
  onChange={e => {
    const plantId = e.target.value
    setSelectedCompanyPlantId(plantId)
    setForm(f => ({
      ...f,
      company_plant_id: plantId,
    }))
  }}
  error={!!errors.company_plant_id}
>
  <option value="">— เลือก Plant —</option>

  {availableCompanyPlants.map((cp: any) => (
    <option key={cp.id} value={cp.id}>
      {cp.plant?.code ? `[${cp.plant.code}] ` : ''}
      {cp.plant?.name_th ?? cp.plants?.name_th ?? cp.id}
    </option>
  ))}
</Select>
        </Field>
        <FormGrid>
          <Field label="รหัสกะ (code)" required error={errors.code}><Input placeholder="SH-D3" value={form.code} onChange={e => s('code', e.target.value)} error={!!errors.code} /></Field>
          <Field label="เวลาเริ่ม (default_time)" required><Input type="time" value={form.default_time} onChange={e => s('default_time', e.target.value)} /></Field>
        </FormGrid>
        <Field label="ชื่อกะ (name_th)" required error={errors.name_th}><Input placeholder="กะเช้า (ปกติ)" value={form.name_th} onChange={e => s('name_th', e.target.value)} error={!!errors.name_th} /></Field>
        <Field label="ชื่อกะ (name_en)"><Input placeholder="Morning Shift (Regular)" value={form.name_en} onChange={e => s('name_en', e.target.value)} /></Field>
        <FormGrid>
          <Field label="ประเภทกะ (type)">
            <Select value={form.type} onChange={e => s('type', e.target.value)}>
              <option value="regular">ปกติ (regular)</option>
              <option value="overtime">ล่วงเวลา (overtime)</option>
            </Select>
          </Field>
          <Field label="ช่วงเวลา (schedule)">
            <Select value={form.schedule} onChange={e => s('schedule', e.target.value)}>
              <option value="day">กลางวัน (day)</option>
              <option value="night">กลางคืน (night)</option>
            </Select>
          </Field>
        </FormGrid>
        <Field label="กลุ่มกะ (shift_group)">
          <Select value={form.shift_group_id ?? ''} onChange={e => s('shift_group_id', e.target.value)}>
            <option value="">— ไม่ระบุ —</option>
            {shiftGroups.map(g => <option key={g.id} value={g.id}>{g.name_th}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// EDIT SHIFT MODAL
// ═══════════════════════════════════════

export function EditShiftModal() {
  const { modal, closeModal} = useStore()
  const { updateShift } = useShiftStore()
  const { shiftGroups} = useShiftGroupStore()
  const open = modal.type === 'edit-shift'
  const shift = modal.data as Shift | undefined

  const [form, setForm] = useState({
    name_th: '',
    name_en: '',
    type: 'regular' as 'regular' | 'overtime',
    schedule: 'day' as 'day' | 'night',
    shift_group_id: null as string | null,
    default_time: '07:00',
  })

  useEffect(() => {
    if (!open || !shift) return

    setForm({
      name_th: shift.name_th ?? '',
      name_en: shift.name_en ?? 'NA',
      type: shift.type ?? 'regular',
      schedule: shift.schedule ?? 'day',
      shift_group_id: shift.shift_group_id ?? null,
      default_time: shift.default_time ?? '07:00',
    })
  }, [open, shift])

  if (!open || !shift) return null

  const s = (k: string, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    updateShift(shift.id, {
      ...form,
      name_en: form.name_en?.trim() || 'NA',
      shift_group_id: form.shift_group_id || undefined,
    })
  }

  return (
      <Modal
      open={open}
      onClose={closeModal}
      title={`แก้ไขกะ · ${shift.code}`}
      subtitle="shifts table"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={closeModal}>
            ยกเลิก
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัสกะ (code)">
            <Input value={shift.code} disabled />
          </Field>
          <Field label="เวลาเริ่ม (default_time)" required>
            <Input type="time" value={form.default_time} onChange={e => s('default_time', e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="ชื่อกะ (name_th)" required>
          <Input value={form.name_th} onChange={e => s('name_th', e.target.value)} />
        </Field>
        <Field label="ชื่อกะ (name_en)">
          <Input value={form.name_en} onChange={e => s('name_en', e.target.value)} />
        </Field>
        <FormGrid>
          <Field label="ประเภทกะ (type)">
            <Select value={form.type} onChange={e => s('type', e.target.value)}>
              <option value="regular">ปกติ (regular)</option>
              <option value="overtime">ล่วงเวลา (overtime)</option>
            </Select>
          </Field>
          <Field label="ช่วงเวลา (schedule)">
            <Select value={form.schedule} onChange={e => s('schedule', e.target.value)}>
              <option value="day">กลางวัน (day)</option>
              <option value="night">กลางคืน (night)</option>
            </Select>
          </Field>
        </FormGrid>
        <Field label="กลุ่มกะ (shift_group)">
          <Select value={form.shift_group_id ?? ''} onChange={e => s('shift_group_id', e.target.value)}>
            <option value="">— ไม่ระบุ —</option>
            {shiftGroups.map(g => <option key={g.id} value={g.id}>{g.name_th}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// SHIFT GROUP MODALS
// ═══════════════════════════════════════

export function AddShiftGroupModal() {
  const { modal, closeModal } = useStore()
  const { addShiftGroup} = useShiftGroupStore()
  const open = modal.type === 'add-shift-group'
  const companyPlantId: string | null = modal.data?.company_plant_id ?? null
  const [form, setForm] = useState({ code: '', name_th: '', name_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    if (!form.name_en.trim()) e.name_en = 'จำเป็น'
    setErrors(e)
    return !Object.keys(e).length
  }
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มกลุ่มกะ" subtitle="shift_groups table" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => { if (validate()) addShiftGroup({ ...form, company_plant_id: companyPlantId ?? undefined }) }}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัส (code)" required error={errors.code}>
            <Input placeholder="GRP-01" value={form.code} onChange={e => s('code', e.target.value)} error={!!errors.code} />
          </Field>
        </FormGrid>
        <Field label="ชื่อกลุ่ม (TH)" required error={errors.name_th}>
          <Input placeholder="กลุ่มกะเช้า" value={form.name_th} onChange={e => s('name_th', e.target.value)} error={!!errors.name_th} />
        </Field>
        <Field label="ชื่อกลุ่ม (EN)" required error={errors.nam_en}>
          <Input placeholder="Morning Group" value={form.name_en} onChange={e => s('name_en', e.target.value)} error={!!errors.name_en} />
        </Field>
      </div>
    </Modal>
  )
}

export function EditShiftGroupModal() {
  const { modal, closeModal } = useStore()
   const { updateShiftGroup} = useShiftGroupStore()
  const open = modal.type === 'edit-shift-group'
  const group = modal.data as ShiftGroup | undefined

  const [form, setForm] = useState({
    code: '',
    name_th: '',
    name_en: '',
  })

  useEffect(() => {
    if (!open || !group) return

    setForm({
      code: group.code ?? '',
      name_th: group.name_th ?? '',
      name_en: group.name_en ?? 'NA',
    })
  }, [open, group])

  if (!open || !group) return null

  const s = (k: string, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    updateShiftGroup(group.id, {
      ...form,
      name_en: form.name_en?.trim() || 'NA',
    })
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={`แก้ไขกลุ่มกะ · ${group.code}`}
      subtitle="shift_groups table"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={closeModal}>
            ยกเลิก
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัส (code)">
            <Input value={form.code} disabled />
          </Field>
        </FormGrid>

        <Field label="ชื่อกลุ่ม (TH)" required>
          <Input
            value={form.name_th}
            onChange={e => s('name_th', e.target.value)}
          />
        </Field>

        <Field label="ชื่อกลุ่ม (EN)">
          <Input
            value={form.name_en}
            onChange={e => s('name_en', e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// CALENDAR MODALS
// ═══════════════════════════════════════

export function AddCalendarModal() {
  const { modal, closeModal } = useStore()
  const { addCalendar } = useCalendarStore()
  const open = modal.type === 'add-calendar'
  const [form, setForm] = useState({ name_th: '', name_en: '', date_at: new Date().toISOString().slice(0, 10), type: 'holiday' as 'holiday' | 'weekday' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name_th) e.name_th = 'จำเป็น'
    if (!form.date_at) e.date_at = 'จำเป็น'
    setErrors(e)
    return !Object.keys(e).length
  }

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มรายการปฏิทิน" subtitle="calendars table" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => { if (validate()) { addCalendar(form); setForm({ name_th: '', name_en: '', date_at: new Date().toISOString().slice(0, 10), type: 'holiday' }) } }}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="วันที่ (date_at)" required error={errors.date_at}><Input type="date" value={form.date_at} onChange={e => s('date_at', e.target.value)} error={!!errors.date_at} /></Field>
          <Field label="ประเภท (type)">
            <Select value={form.type} onChange={e => s('type', e.target.value)}>
              <option value="holiday">วันหยุด (holiday)</option>
              <option value="weekday">วันทำงาน (weekday)</option>
            </Select>
          </Field>
        </FormGrid>
        <Field label="ชื่อ (name_th)" required error={errors.name_th}><Input placeholder="วันสงกรานต์" value={form.name_th} onChange={e => s('name_th', e.target.value)} error={!!errors.name_th} /></Field>
        <Field label="ชื่อ (name_en)"><Input placeholder="Songkran" value={form.name_en} onChange={e => s('name_en', e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// SHIFT DELETE MODAL
// ═══════════════════════════════════════

export function DeleteShiftModal() {
  const {deleteShift} = useShiftStore()
  const { modal, closeModal } = useStore()
  const open = modal.type === 'delete-shift'
  const shift = modal.data as import('@/types').Shift | undefined
  if (!shift || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบกะ" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteShift(shift.id)}>ลบกะ</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🕐</div>
        <p className="font-bold text-slate-800">{shift.name_th}</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">{shift.code} · {shift.default_time} น.</p>
        <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">จะเปลี่ยนสถานะเป็น inactive</p>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// PLANT MODALS
// ═══════════════════════════════════════

function PlantForm({
  form, errors, onChange, customerCompanies,
}: {
  form: { code: string; name_th: string; name_en: string; latitude: string; longitude: string; company_id: string }
  errors: Record<string, string>
  onChange: (key: string, value: string) => void
  customerCompanies: { id: string; name_th: string; code: string }[]
}) {
  return (
    <div className="space-y-4">
      <Field label="บริษัทลูกค้า (customer)" required error={errors.company_id}>
        <Select value={form.company_id} onChange={e => onChange('company_id', e.target.value)} error={!!errors.company_id}>
          <option value="">— เลือกบริษัทลูกค้า —</option>
          {customerCompanies.map(c => (
            <option key={c.id} value={c.id}>{c.name_th} ({c.code})</option>
          ))}
        </Select>
      </Field>
      <FormGrid>
        <Field label="รหัสพื้นที่ (code)" required error={errors.code}>
          <Input placeholder="เช่น GTW, BPK, EISE" value={form.code} onChange={e => onChange('code', e.target.value)} error={!!errors.code} />
        </Field>
        <Field label="ชื่อ (EN)" required error={errors.name_en}>
          <Input placeholder="e.g. Gateway Plant" value={form.name_en} onChange={e => onChange('name_en', e.target.value)} error={!!errors.name_en} />
        </Field>
      </FormGrid>
      <Field label="ชื่อ (ภาษาไทย)" required error={errors.name_th}>
        <Input placeholder="เช่น เกตเวย์, บางปะกง" value={form.name_th} onChange={e => onChange('name_th', e.target.value)} error={!!errors.name_th} />
      </Field>
      <FormGrid>
        <Field label="Latitude" required error={errors.latitude}>
          <Input type="number" step="0.0001" placeholder="13.6500" value={form.latitude} onChange={e => onChange('latitude', e.target.value)} error={!!errors.latitude} />
        </Field>
        <Field label="Longitude" required error={errors.longitude}>
          <Input type="number" step="0.0001" placeholder="100.6200" value={form.longitude} onChange={e => onChange('longitude', e.target.value)} error={!!errors.longitude} />
        </Field>
      </FormGrid>
    </div>
  )
}

const EMPTY_PLANT_FORM = { code: '', name_th: '', name_en: '', latitude: '', longitude: '', company_id: '' }

export function AddPlantModal() {
  const { modal, closeModal,  } = useStore()
  const {addPlant } = usePlantStore()
  const {companies, loadCompanies} = useCompanyStore()
  const open = modal.type === 'add-plant'
  const [form, setForm] = useState(EMPTY_PLANT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const customerCompanies = useMemo(
    () => companies.filter(c => c.company_type === 'customer' && c.is_status === 'active'),
    [companies],
  )

  useEffect(() => { if (open) loadCompanies() }, [open, loadCompanies])
  useEffect(() => { if (!open) { setForm(EMPTY_PLANT_FORM); setErrors({}) } }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.company_id) e.company_id = 'กรุณาเลือกบริษัทลูกค้า'
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    if (!form.name_en.trim()) e.name_en = 'จำเป็น'
    if (!form.latitude || isNaN(Number(form.latitude))) e.latitude = 'กรอกตัวเลข'
    if (!form.longitude || isNaN(Number(form.longitude))) e.longitude = 'กรอกตัวเลข'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    addPlant({
      code: form.code, name_th: form.name_th, name_en: form.name_en,
      latitude: Number(form.latitude), longitude: Number(form.longitude),
      company_id: form.company_id,
    })
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มพื้นที่ (Plant)" subtitle="plants table" size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึกพื้นที่</Button>
      </>}
    >
      <PlantForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} customerCompanies={customerCompanies} />
    </Modal>
  )
}

export function EditPlantModal() {
  const { modal, closeModal } = useStore()
  const {updatePlant } = usePlantStore()
  const {companies, companyPlants, loadCompanies} =useCompanyStore()
  const open = modal.type === 'edit-plant'
  const plant = modal.data as Plant | undefined
  const [form, setForm] = useState(EMPTY_PLANT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const customerCompanies = useMemo(
    () => companies.filter(c => c.company_type === 'customer' && c.is_status === 'active'),
    [companies],
  )

  useEffect(() => { if (open) loadCompanies() }, [open, loadCompanies])

  useEffect(() => {
    if (open && plant) {
      const cp = companyPlants.find(c => c.plant_id === plant.id)
      setForm({
        code: plant.code, name_th: plant.name_th, name_en: plant.name_en,
        latitude: String(plant.latitude), longitude: String(plant.longitude),
        company_id: cp?.company_id ?? '',
      })
    }
  }, [open, plant, companyPlants])

  if (!plant) return null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    if (!form.name_en.trim()) e.name_en = 'จำเป็น'
    if (!form.latitude || isNaN(Number(form.latitude))) e.latitude = 'กรอกตัวเลข'
    if (!form.longitude || isNaN(Number(form.longitude))) e.longitude = 'กรอกตัวเลข'
    setErrors(e)
    return !Object.keys(e).length
  }

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไขพื้นที่" subtitle={`plants · ${plant.code}`} size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => {
          if (!validate()) return
          updatePlant(plant.id, {
            code: form.code, name_th: form.name_th, name_en: form.name_en,
            latitude: Number(form.latitude), longitude: Number(form.longitude),
            company_id: form.company_id || undefined,
          })
        }}>บันทึกการแก้ไข</Button>
      </>}
    >
      <PlantForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} customerCompanies={customerCompanies} />
    </Modal>
  )
}

export function DeletePlantModal() {
  const { modal, closeModal } = useStore()
  const {deletePlant} = usePlantStore()
  const open = modal.type === 'delete-plant'
  const plant = modal.data as Plant | undefined
  if (!plant || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบพื้นที่" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deletePlant(plant.id)}>ลบพื้นที่</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
          <MapPin size={24} className="text-red-500" />
        </div>
        <p className="font-bold text-slate-800">{plant.name_th}</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">{plant.code} · {plant.name_en}</p>
        <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">จะเปลี่ยนสถานะเป็น inactive (soft delete)</p>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// COMPANY MODALS
// ═══════════════════════════════════════

const COMPANY_TYPE_OPTIONS: { value: CompanyType; labelTh: string; labelEn: string }[] = [
  { value: 'internal', labelTh: 'Internal (ระบบ)', labelEn: 'Internal (System)' },
  { value: 'customer', labelTh: 'Customer (ลูกค้า)', labelEn: 'Customer' },
  { value: 'vendor',   labelTh: 'Vendor (ผู้ให้บริการรถ)', labelEn: 'Vendor' },
]

function CompanyForm({
  form,
  errors,
  onChange,
}: {
  form: { code: string; name_th: string; name_en: string; address: string; company_type: CompanyType }
  errors: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <FormGrid>
        <Field label="รหัสบริษัท (code)" required error={errors.code}>
          <Input placeholder="เช่น NIC" value={form.code} onChange={e => onChange('code', e.target.value)} error={!!errors.code} />
        </Field>
        <Field label="ประเภทบริษัท (company_type)" required>
          <Select value={form.company_type} onChange={e => onChange('company_type', e.target.value)}>
            {COMPANY_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.labelTh}</option>
            ))}
          </Select>
        </Field>
      </FormGrid>
      <Field label="ชื่อ (ภาษาไทย)" required error={errors.name_th}>
        <Input placeholder="เช่น บริษัท นิค แมนูแฟคเจอริ่ง จำกัด" value={form.name_th} onChange={e => onChange('name_th', e.target.value)} error={!!errors.name_th} />
      </Field>
      <Field label="ชื่อ (ภาษาอังกฤษ)">
        <Input placeholder="e.g. Nic Manufacturing Co., Ltd." value={form.name_en} onChange={e => onChange('name_en', e.target.value)} />
      </Field>
      <Field label="ที่อยู่">
        <Textarea placeholder="ที่อยู่บริษัท" value={form.address} onChange={e => onChange('address', e.target.value)} rows={2} />
      </Field>
    </div>
  )
}

export function AddCompanyModal() {
  const { modal, closeModal } = useStore()
  const {addCompany} =  useCompanyStore()
  const open = modal.type === 'add-company'
  const [form, setForm] = useState({ code: '', name_th: '', name_en: '', address: '', company_type: 'customer' as CompanyType })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { if (!open) { setForm({ code: '', name_th: '', name_en: '', address: '', company_type: 'customer' }); setErrors({}) } }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'กรุณากรอกรหัส'
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อภาษาไทย'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    addCompany({ ...form, address: form.address || null })
    setForm({ code: '', name_th: '', name_en: '', address: '', company_type: 'customer' })
    setErrors({})
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มบริษัท" subtitle="companies table" size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึกบริษัท</Button>
      </>}
    >
      <CompanyForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} />
    </Modal>
  )
}

export function EditCompanyModal() {
  const { modal, closeModal } = useStore()
  const {updateCompany} = useCompanyStore()
  const open = modal.type === 'edit-company'
  const company = modal.data as Company | undefined
  const [form, setForm] = useState({ code: '', name_th: '', name_en: '', address: '', company_type: 'customer' as CompanyType })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && company) {
      setForm({ code: company.code, name_th: company.name_th, name_en: company.name_en, address: company.address ?? '', company_type: company.company_type })
    }
  }, [open, company])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'กรุณากรอกรหัส'
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อภาษาไทย'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate() || !company) return
    updateCompany(company.id, { ...form, address: form.address || null })
  }

  if (!company) return null

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไขบริษัท" subtitle={`companies · ${company.code}`} size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึกการแก้ไข</Button>
      </>}
    >
      <CompanyForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} />
    </Modal>
  )
}

export function DeleteCompanyModal() {
  const { modal, closeModal } = useStore()
  const {deleteCompany} = useCompanyStore()
  const open = modal.type === 'delete-company'
  const company = modal.data as Company | undefined
  if (!company || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบบริษัท" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteCompany(company.id)}>ลบบริษัท</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
          <Building2 size={24} className="text-red-500" />
        </div>
        <p className="font-bold text-slate-800">{company.name_th}</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">{company.code}</p>
        <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">จะเปลี่ยนสถานะเป็น inactive (soft delete)</p>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// COORDINATOR TYPE MODALS
// ═══════════════════════════════════════

export function AddCoordinatorTypeModal() {
  const { modal, closeModal } = useStore()
  const { addCoordinatorType } = useCoordinatorStore()
  const open = modal.type === 'add-coordinator-type'
  const [form, setForm] = useState({ name_th: '', name_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { if (!open) { setForm({ name_th: '', name_en: '' }); setErrors({}) } }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อไทย'
    if (!form.name_en.trim()) e.name_en = 'กรุณากรอกชื่ออังกฤษ'
    setErrors(e)
    return !Object.keys(e).length
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มประเภทโคออร์ดิเนเตอร์" size="sm">
      <div className="space-y-4">
        <FormGrid cols={1}>
          <Field label="ชื่อ (ไทย)" required error={errors.name_th}>
            <Input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} placeholder="เช่น โคออร์ดิเนเตอร์ Vendor รถ" />
          </Field>
          <Field label="ชื่อ (English)" required error={errors.name_en}>
            <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="e.g. Vehicle Vendor Coordinator" />
          </Field>
        </FormGrid>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={closeModal} className="flex-1">ยกเลิก</Button>
          <Button variant="primary" size="sm" onClick={() => { if (validate()) addCoordinatorType(form) }} className="flex-1">บันทึก</Button>
        </div>
      </div>
    </Modal>
  )
}

export function EditCoordinatorTypeModal() {
  const { modal, closeModal } = useStore()
  const { updateCoordinatorType } = useCoordinatorStore()
  const open = modal.type === 'edit-coordinator-type'
  const ct = modal.data as CoordinatorType | undefined
  const [form, setForm] = useState({ name_th: '', name_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && ct) setForm({ name_th: ct.name_th, name_en: ct.name_en })
    if (!open) setErrors({})
  }, [open, ct])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อไทย'
    if (!form.name_en.trim()) e.name_en = 'กรุณากรอกชื่ออังกฤษ'
    setErrors(e)
    return !Object.keys(e).length
  }

  if (!ct || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไขประเภทโคออร์ดิเนเตอร์" size="sm">
      <div className="space-y-4">
        <FormGrid cols={1}>
          <Field label="ชื่อ (ไทย)" required error={errors.name_th}>
            <Input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} />
          </Field>
          <Field label="ชื่อ (English)" required error={errors.name_en}>
            <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
          </Field>
        </FormGrid>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={closeModal} className="flex-1">ยกเลิก</Button>
          <Button variant="primary" size="sm" onClick={() => { if (validate()) updateCoordinatorType(ct.id, form) }} className="flex-1">บันทึก</Button>
        </div>
      </div>
    </Modal>
  )
}

export function DeleteCoordinatorTypeModal() {
  const { modal, closeModal } = useStore()
  const { deleteCoordinatorType } = useCoordinatorStore()
  const open = modal.type === 'delete-coordinator-type'
  const ct = modal.data as CoordinatorType | undefined
  if (!ct || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบประเภท" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteCoordinatorType(ct.id)}>ลบ</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
          <Users size={24} className="text-red-500" />
        </div>
        <p className="font-bold text-slate-800">{ct.name_th}</p>
        <p className="text-xs text-slate-400 mt-1">{ct.name_en}</p>
        <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">ประเภทนี้จะถูกลบถาวร หากมีโคออร์ดิเนเตอร์ผูกอยู่จะไม่สามารถลบได้</p>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// COORDINATOR MODALS
// ═══════════════════════════════════════

function CoordinatorForm({
  form, errors, onChange, coordinatorTypes, companies,
}: {
  form: { coordinator_type_id: string; company_id: string; name_th: string; name_en: string; tel: string; email: string }
  errors: Record<string, string>
  onChange: (k: string, v: string) => void
  coordinatorTypes: CoordinatorType[]
  companies: { id: string; name_th: string; code: string; company_type: string }[]
}) {
  const activeTypes = coordinatorTypes.filter(t => t.is_status === 'active')
  const allCompanies = companies.filter(c => c.company_type !== 'internal')

  return (
    <div className="space-y-4">
      <FormGrid cols={1}>
        <Field label="ประเภทโคออร์ดิเนเตอร์" required error={errors.coordinator_type_id}>
          <Select value={form.coordinator_type_id} onChange={e => onChange('coordinator_type_id', e.target.value)}>
            <option value="">— เลือกประเภท —</option>
            {activeTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name_th}</option>
            ))}
          </Select>
        </Field>
        <Field label="บริษัทที่สังกัด" error={errors.company_id}>
          <Select value={form.company_id} onChange={e => onChange('company_id', e.target.value)}>
            <option value="">— ไม่ระบุ (Locomo internal) —</option>
            {allCompanies.map(c => (
              <option key={c.id} value={c.id}>{c.name_th} ({c.code})</option>
            ))}
          </Select>
        </Field>
      </FormGrid>
      <FormGrid cols={2}>
        <Field label="ชื่อ (ไทย)" required error={errors.name_th}>
          <Input value={form.name_th} onChange={e => onChange('name_th', e.target.value)} placeholder="ชื่อ-นามสกุล" />
        </Field>
        <Field label="ชื่อ (English)" required error={errors.name_en}>
          <Input value={form.name_en} onChange={e => onChange('name_en', e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="เบอร์โทร" error={errors.tel}>
          <Input value={form.tel} onChange={e => onChange('tel', e.target.value)} placeholder="08xxxxxxxx" />
        </Field>
        <Field label="อีเมล" error={errors.email}>
          <Input value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="name@example.com" />
        </Field>
      </FormGrid>
    </div>
  )
}

const emptyCoordForm = { coordinator_type_id: '', company_id: '', name_th: '', name_en: '', tel: '', email: '' }

export function AddCoordinatorModal() {
  const { modal, closeModal } = useStore()
  const {companies,} = useCompanyStore()
  const { coordinatorTypes, addCoordinator, loadCoordinators } = useCoordinatorStore()
  const open = modal.type === 'add-coordinator'
  const [form, setForm] = useState(emptyCoordForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { if (open) loadCoordinators() }, [open, loadCoordinators])
  useEffect(() => { if (!open) { setForm(emptyCoordForm); setErrors({}) } }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.coordinator_type_id) e.coordinator_type_id = 'กรุณาเลือกประเภท'
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อไทย'
    if (!form.name_en.trim()) e.name_en = 'กรุณากรอกชื่ออังกฤษ'
    setErrors(e)
    return !Object.keys(e).length
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มโคออร์ดิเนเตอร์" size="md">
      <div className="space-y-4">
        <CoordinatorForm
          form={form} errors={errors}
          onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          coordinatorTypes={coordinatorTypes}
          companies={companies}
        />
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={closeModal} className="flex-1">ยกเลิก</Button>
          <Button variant="primary" size="sm" onClick={() => {
            if (!validate()) return
            addCoordinator({
              coordinator_type_id: form.coordinator_type_id,
              company_id: form.company_id || null,
              name_th: form.name_th,
              name_en: form.name_en,
              tel: form.tel || null,
              email: form.email || null,
            })
          }} className="flex-1">บันทึก</Button>
        </div>
      </div>
    </Modal>
  )
}

export function EditCoordinatorModal() {
  const { modal, closeModal } = useStore()
  const {companies} =useCompanyStore()
  const { updateCoordinator, coordinatorTypes, loadCoordinators } = useCoordinatorStore()
  const open = modal.type === 'edit-coordinator'
  const cdn = modal.data as Coordinator | undefined
  const [form, setForm] = useState(emptyCoordForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { if (open) loadCoordinators() }, [open, loadCoordinators])
  useEffect(() => {
    if (open && cdn) {
      setForm({
        coordinator_type_id: cdn.coordinator_type_id,
        company_id: cdn.company_id ?? '',
        name_th: cdn.name_th,
        name_en: cdn.name_en,
        tel: cdn.tel ?? '',
        email: cdn.email ?? '',
      })
    }
    if (!open) setErrors({})
  }, [open, cdn])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.coordinator_type_id) e.coordinator_type_id = 'กรุณาเลือกประเภท'
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อไทย'
    if (!form.name_en.trim()) e.name_en = 'กรุณากรอกชื่ออังกฤษ'
    setErrors(e)
    return !Object.keys(e).length
  }

  if (!cdn || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไขโคออร์ดิเนเตอร์" size="md">
      <div className="space-y-4">
        <CoordinatorForm
          form={form} errors={errors}
          onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          coordinatorTypes={coordinatorTypes}
          companies={companies}
        />
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={closeModal} className="flex-1">ยกเลิก</Button>
          <Button variant="primary" size="sm" onClick={() => {
            if (!validate()) return
            updateCoordinator(cdn.id, {
              coordinator_type_id: form.coordinator_type_id,
              company_id: form.company_id || null,
              name_th: form.name_th,
              name_en: form.name_en,
              tel: form.tel || null,
              email: form.email || null,
            })
          }} className="flex-1">บันทึก</Button>
        </div>
      </div>
    </Modal>
  )
}

export function DeleteCoordinatorModal() {
  const { modal, closeModal } = useStore()
  const { deleteCoordinator } = useCoordinatorStore()
  const open = modal.type === 'delete-coordinator'
  const cdn = modal.data as Coordinator | undefined
  if (!cdn || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบโคออร์ดิเนเตอร์" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteCoordinator(cdn.id)}>ลบ</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
          <Users size={24} className="text-red-500" />
        </div>
        <p className="font-bold text-slate-800">{cdn.name_th}</p>
        <p className="text-xs text-slate-400 mt-1">{cdn.name_en}</p>
        <p className="text-xs text-slate-400">{cdn.coordinator_type?.name_th}</p>
        <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">โคออร์ดิเนเตอร์นี้จะถูกลบออกจากระบบถาวร</p>
      </div>
    </Modal>
  )
}
