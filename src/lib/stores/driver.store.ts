import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"
import { useStore } from "@/lib/store"
import { Driver, DriverVehicle, DriverVehicleVendor, Status } from "@/types"
import { create } from "zustand"

type DriverState = {
  drivers: Driver[]
  driverVehicles: DriverVehicle[]
  driverVehicleVendors: DriverVehicleVendor[]
 
 loadDrivers: () => Promise<void>
 loadDriverVehicleVendors: () => Promise<void>
  addDriver: (data: Partial<Driver>) => Promise<void>
  updateDriver: (id: string, data: Partial<Driver>) => Promise<void>
  deleteDriver: (id: string) => Promise<void>
  addDriverRouteDefault: (driver_id: string, route_id: string, trip_direction?: string) => Promise<void>
  removeDriverRouteDefault: (driver_id: string, rd_id: string) => Promise<void>
  assignDriverVehicle: (driver_id: string, vehicle_id: string, vendor_id: string) => Promise<void>
  unassignDriverVehicle: (driver_id: string) => Promise<void>
}

export const useDriverStore = create<DriverState>((set, get) => ({
drivers: [],
  driverVehicles: [],
  driverVehicleVendors: [],

    loadDrivers: async () => {
         const mainStore = useStore.getState()
      try {
        const res = await apiFetch('/api/drivers?limit=500', { headers: authHeader() })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        set({ drivers: json.data?.data ?? json.data ?? [] })
      } catch (err: any) { mainStore.addToast('error', err.message ?? 'โหลดข้อมูลคนขับไม่สำเร็จ') }
    },
  //       loadVendorDriverVehicle: async () => {
  //   try {
  //     const vendor = useVendorStore.getState().vendors
  //     const res = await apiFetch('/api/vendors/all/driver-vehicles', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) {
  //       const raw = json.data?.data ?? json.data ?? []
  //       set({
  //         vendors: raw,
  //         companyVendors: raw.flatMap((v: any) => v.companies_vendors ?? []),
  //         driverVehicle: raw.flatMap((v: any) => v.driverVehicle ?? []),
  //       })
  //     }
  //   } catch { /* keep current state */ }
  // },
  
loadDriverVehicleVendors: async () => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/vendors/all/driver-vehicles', {
        headers: authHeader(),
      })
      const json = await res.json()
      if (!json.success && res.status !== 200) {
        throw new Error(json.error ?? 'โหลดข้อมูลไม่สำเร็จ')
      }

      
      const raw = json.body?.data ?? json.data?.data ?? json.data ?? []

      // map field plural → singular ให้ตรงกับ type
      const mapped: DriverVehicleVendor[] = raw.map((it: any) => ({
        id: it.id,
        vendor_id: it.vendor_id,
        driver_vehicle_id: it.driver_vehicle_id,
        is_status: it.is_status,
        created_at: it.created_at,
        updated_at: it.updated_at,
        vendor: it.vendors ?? null,
        driver_vehicle: it.drivers_vehicles
          ? {
              id: it.drivers_vehicles.id,
              driver_id: it.drivers_vehicles.driver_id,
              vehicle_id: it.drivers_vehicles.vehicle_id,
              driver: it.drivers_vehicles.drivers ?? null,
              vehicle: it.drivers_vehicles.vehicles ?? null,
            }
          : null,
      }))

      set({ driverVehicleVendors: mapped })
    } catch (err: any) {
      mainStore.addToast('error', err.message ?? 'โหลดข้อมูลชุดคนขับไม่สำเร็จ')
    }
  },

    addDriver: async (data) => {
        const mainStore = useStore.getState()
      try {
        const res = await apiFetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        const created = json.data as Driver
        set(s => ({ drivers: [created, ...s.drivers] }))
        mainStore.addToast('success', `เพิ่มคนขับ "${created.first_name_th} ${created.last_name_th}" สำเร็จ`)
        mainStore.closeModal()
      } catch (err: any) { mainStore.addToast('error', err.message ?? 'เพิ่มคนขับไม่สำเร็จ') }
    },
  
  updateDriver: async (id, data) => {
       const mainStore = useStore.getState()
    try {
      const payload = {
        code: data.code,
        first_name_th: data.first_name_th,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || 'NA',
        last_name_en: data.last_name_en || 'NA',
        tel: data.tel || null,
        status:  data.is_status ?? 'active',
      }
  
      const res = await apiFetch(`/api/drivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      })
  
      const json = await res.json()
      console.log('update driver response', json)
  
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
      }
  
      const updated = json.data as Driver
  
      set(s => ({
        drivers: s.drivers.map(d =>
          d.id === id || d.id === updated.id ? updated : d
        ),
      }))
  
      mainStore.addToast('success', 'อัปเดตคนขับสำเร็จ')
      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast('error', err.message ?? 'อัปเดตคนขับไม่สำเร็จ')
    }
  },
   deleteDriver: async (id) => {
       const mainStore = useStore.getState()
    try {
      const drv = get().drivers.find(d => d.id === id)
  
        const res = await apiFetch('/api/drivers/' + id, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      console.log('delete driver response', json)
  
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? json.error ?? 'เกิดข้อผิดพลาด')
      }
  
      set(s => ({
        drivers: s.drivers.map(d =>
          d.id === id ? { ...d, is_status: 'inactive' as Status } : d
        ),
      }))
  
      mainStore.addToast('success', `ลบคนขับ "${drv?.first_name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (err: any) {
     mainStore.addToast('error', err.message ?? 'ลบคนขับไม่สำเร็จ')
    }
  },
  
    addDriverRouteDefault: async (driver_id, route_id, trip_direction) => {
           const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/drivers/${driver_id}/route-defaults`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ route_id, trip_direction }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        const rd = json.data
        set(s => ({
          drivers: s.drivers.map(d => d.id === driver_id
            ? { ...d, driver_route_defaults: [...(d.driver_route_defaults ?? []), rd] }
            : d
          ),
        }))
        mainStore.addToast('success', 'เพิ่ม default สายรถสำเร็จ')
      } catch (err: any) { mainStore.addToast('error', err.message ?? 'เพิ่ม default สายรถไม่สำเร็จ') }
    },
  
    removeDriverRouteDefault: async (driver_id, rd_id) => {
           const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/drivers/${driver_id}/route-defaults?rd_id=${rd_id}`, {
          method: 'DELETE',
          headers: authHeader(),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        set(s => ({
          drivers: s.drivers.map(d => d.id === driver_id
            ? { ...d, driver_route_defaults: (d.driver_route_defaults ?? []).filter(r => r.id !== rd_id) }
            : d
          ),
        }))
       mainStore.addToast('success', 'ลบ default สายรถสำเร็จ')
      } catch (err: any) { mainStore.addToast('error', err.message ?? 'ลบ default สายรถไม่สำเร็จ') }
    },
  
    assignDriverVehicle: async (driver_id, vehicle_id, vendor_id) => {
           const mainStore = useStore.getState()
      try {
        // 1. create/update drivers_vehicles record
        const dvRes = await apiFetch(`/api/drivers/${driver_id}/vehicle`, {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicle_id }),
        })
        const dvJson = await dvRes.json()
        if (!dvJson.success) throw new Error(dvJson.message ?? 'ไม่สามารถกำหนดรถได้')
        const driver_vehicle_id = dvJson.data.id
  
        // 2. link driver_vehicle to vendor
        const vdvRes = await apiFetch(`/api/vendors/${vendor_id}/driver-vehicles`, {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ driver_vehicle_id }),
        })
        const vdvJson = await vdvRes.json()
        if (!vdvJson.success) throw new Error(vdvJson.message ?? 'ไม่สามารถผูก Vendor ได้')
  
        mainStore.addToast('success', 'กำหนดรถให้คนขับสำเร็จ')
        mainStore.closeModal()
        await get().loadDrivers()
      } catch (err: any) { mainStore.addToast('error', err.message ?? 'เกิดข้อผิดพลาด') }
    },
  
    unassignDriverVehicle: async (driver_id) => {
           const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/drivers/${driver_id}/vehicle`, {
          method: 'DELETE',
          headers: authHeader(),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message ?? 'ถอดรถไม่สำเร็จ')
        mainStore.addToast('success', 'ถอดรถออกสำเร็จ')
        await get().loadDrivers()
      } catch (err: any) { mainStore.addToast('error', err.message ?? 'เกิดข้อผิดพลาด') }
    
  },
}))