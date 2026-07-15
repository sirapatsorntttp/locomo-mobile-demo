import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"
import { useStore } from "@/lib/store"
import { Vendor, CompanyVendor, PlantVendorService, DriverVehicle, Status } from "@/types"
import { create } from "zustand"

export type VendorState = {
  vendors: Vendor[]
  companyVendors: CompanyVendor[]
  plantVendorServices: PlantVendorService[]
  driverVehicle: DriverVehicle[]
  loadVendors: () => Promise<void>
  addVendor: (data: Partial<Vendor>) => Promise<void>
  updateVendor: (id: string, data: Partial<Vendor>) => Promise<void>
  deleteVendor: (id: string) => Promise<void>
  assignVendorCompany: (vendor_id: string, company_id: string) => Promise<void>
  removeVendorCompany: (vendor_id: string) => Promise<void>
  addVendorPlant: (vendor_id: string, plant_id: string) => Promise<void>
  removeVendorPlant: (vendor_id: string, plant_id: string) => Promise<void>
  assignVendorDriverVehicle: (vendor_id: string, driver_vehicle_id: string) => Promise<void>
  removeVendorDriverVehicle: (vendor_id: string, driver_vehicle_id: string) => Promise<void>
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  companyVendors: [],
  plantVendorServices: [],
  driverVehicle: [],

  loadVendors: async () => {
    try {
      const res = await apiFetch('/api/vendors?limit=200', { headers: authHeader() })
      const json = await res.json()
      if (json.success) {
        const raw = json.data?.data ?? json.data ?? []
        set({
          vendors: raw,
          companyVendors: raw.flatMap((v: any) => v.companys_vendors ? [v.companys_vendors] : []),
          plantVendorServices: raw.flatMap((v: any) => v.plants_vendors_services ?? []),
        })
      }
    } catch { /* keep current state */ }
  },

  addVendor: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ vendors: [json.data as Vendor, ...s.vendors] }))
      mainStore.addToast('success', `เพิ่ม Vendor "${(json.data as Vendor).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateVendor: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vendors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, ...(json.data as Vendor) } : v) }))
      mainStore.addToast('success', 'อัปเดต Vendor สำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteVendor: async (id) => {
    const mainStore = useStore.getState()
    const v = get().vendors.find(x => x.id === id)
    try {
      const res = await apiFetch(`/api/vendors/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ vendors: s.vendors.map(x => x.id === id ? { ...x, is_status: 'inactive' as Status } : x) }))
      mainStore.addToast('success', `ลบ Vendor "${v?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  assignVendorCompany: async (vendor_id, company_id) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vendors/${vendor_id}/companies`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ company_id }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadVendors()
      mainStore.addToast('success', 'กำหนดบริษัทให้ Vendor สำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  removeVendorCompany: async (vendor_id) => {
    const mainStore = useStore.getState()
    try {
      const cv = get().companyVendors.find(x => x.vendor_id === vendor_id)
      if (!cv) return
      const res = await apiFetch(`/api/vendors/${vendor_id}/companies`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadVendors()
      mainStore.addToast('success', 'ถอดบริษัทออกจาก Vendor สำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  addVendorPlant: async (vendor_id, plant_id) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vendors/${vendor_id}/plants`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ plant_id }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadVendors()
      mainStore.addToast('success', 'เพิ่มโรงงานให้ Vendor สำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  removeVendorPlant: async (vendor_id, plant_id) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vendors/${vendor_id}/plants?plant_id=${plant_id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadVendors()
      mainStore.addToast('success', 'ลบโรงงานออกจาก Vendor สำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  assignVendorDriverVehicle: async (vendor_id, driver_vehicle_id) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vendors/${vendor_id}/driver-vehicles`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ driver_vehicle_id }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadVendors()
      mainStore.addToast('success', 'กำหนดรถให้ Vendor สำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  removeVendorDriverVehicle: async (vendor_id, driver_vehicle_id) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/vendors/${vendor_id}/driver-vehicles?driver_vehicle_id=${driver_vehicle_id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadVendors()
      mainStore.addToast('success', 'ถอดรถออกจาก Vendor สำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))
