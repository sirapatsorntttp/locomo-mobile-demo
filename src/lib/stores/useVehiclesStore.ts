import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { Vehicle, VehicleType, Status } from '@/types'
import { create } from 'zustand'

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export type VehicleState = {
    vehicles: Vehicle[]
    vehicleTypes: VehicleType[]
    loadVehicles: () => Promise<void>
    addVehicle: (data: Partial<Vehicle>) => Promise<void>
    updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>
    deleteVehicle: (id: string) => Promise<void>
    loadVehicleTypes: () => Promise<void>
    addVehicleType: (data: Partial<VehicleType>) => Promise<void>
    updateVehicleType: (id: string, data: Partial<VehicleType>) => Promise<void>
    deleteVehicleType: (id: string) => Promise<void>
}

export const useVehiclesStore = create<VehicleState>((set, get) => ({
    vehicles: [],
    vehicleTypes: [],

  loadVehicles: async () => {
    try {
      const res = await apiFetch('/api/vehicles?limit=500&page=1', { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ vehicles: json.data.data ?? [] })
    } catch { /* keep current state */ }
  },

  addVehicle: async (data) => {
    const mainstore = useStore.getState()
    try {
      if (!isUuid(data.vehicle_type_id)) {
        mainstore.addToast('error', 'กรุณาเลือกประเภทยานพาหนะจากข้อมูลจริงก่อนบันทึก')
        return
      }
      const res = await apiFetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ vehicle_type_id: data.vehicle_type_id, code: data.code, province: data.province, license: data.license, capacity: data.capacity ?? null, status: data.is_status ?? 'active' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ vehicles: [json.data as Vehicle, ...s.vehicles] }))
      mainstore.addToast('success', `เพิ่มรถ "${(json.data as Vehicle).license}" สำเร็จ`)
      mainstore.closeModal()
    } catch (e: any) { mainstore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateVehicle: async (id, data) => {
    const mainstore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ vehicle_type_id: data.vehicle_type_id, code: data.code, province: data.province, license: data.license, capacity: data.capacity, status: data.is_status }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ vehicles: s.vehicles.map(v => v.id === id ? json.data as Vehicle : v) }))
      mainstore.addToast('success', 'อัปเดตข้อมูลรถสำเร็จ')
      mainstore.closeModal()
    } catch (e: any) { mainstore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteVehicle: async (id) => {
    const mainstore = useStore.getState()
    const veh = get().vehicles.find(v => v.id === id)
    try {
      const res = await apiFetch(`/api/vehicles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: 'inactive' }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ vehicles: s.vehicles.map(v => v.id === id ? json.data as Vehicle : v) }))
      mainstore.addToast('success', `ปิดใช้งานรถ "${veh?.license}" สำเร็จ`)
      mainstore.closeModal()
    } catch (e: any) { mainstore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  // ── Vehicle Types ─────────────────────────────────────────────────────────────
  loadVehicleTypes: async () => {
    try {
      const res = await apiFetch('/api/vehicle-types?limit=200&page=1', { headers: authHeader() })
      const json = await res.json()
      if (json.success) {
        set({ vehicleTypes: (json.data.data ?? []).filter((vt: any) => isUuid(vt.id)).map((vt: any) => ({ ...vt, is_status: vt.is_status ?? 'active', capacity: vt.capacity ?? null })) })
      }
    } catch { set({ vehicleTypes: [] }) }
  },

  addVehicleType: async (data) => {
    const mainstore = useStore.getState()
    try {
      const res = await apiFetch('/api/vehicle-types', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ vehicleTypes: [{ ...json.data, capacity: null }, ...s.vehicleTypes] }))
      mainstore.addToast('success', `เพิ่มประเภทยานพาหนะ "${(json.data as VehicleType).name_th}" สำเร็จ`)
      mainstore.closeModal()
    } catch (e: any) { mainstore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateVehicleType: async (id, data) => {
    const mainstore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vehicle-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      const updated: VehicleType = { ...json.data, capacity: null }
      set(s => ({ vehicleTypes: s.vehicleTypes.map(t => t.id === id ? updated : t), vehicles: s.vehicles.map(v => v.vehicle_type_id === id ? { ...v, vehicle_type: updated } : v) }))
      mainstore.addToast('success', 'อัปเดตประเภทยานพาหนะสำเร็จ')
      mainstore.closeModal()
    } catch (e: any) { mainstore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteVehicleType: async (id) => {
    const mainstore = useStore.getState()
    const vt = get().vehicleTypes.find(t => t.id === id)
    try {
      const next: Status = vt?.is_status === 'active' ? 'inactive' : 'active'
      const res = await apiFetch(`/api/vehicle-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      const updated: VehicleType = { ...json.data, capacity: null }
      set(s => ({ vehicleTypes: s.vehicleTypes.map(t => t.id === id ? updated : t), vehicles: s.vehicles.map(v => v.vehicle_type_id === id ? { ...v, vehicle_type: updated } : v) }))
      mainstore.addToast('success', `${updated.is_status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}ประเภทยานพาหนะ "${vt?.name_th}" สำเร็จ`)
      mainstore.closeModal()
    } catch (e: any) { mainstore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))