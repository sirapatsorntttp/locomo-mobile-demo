
import { apiFetch } from "@/lib/api-fetch"
import { authHeader, getCompanyPlantId, isSuperAdmin } from "@/lib/auth-token"
import { useStore } from "@/lib/store"
import { Shift, ShiftSchedule, ShiftType } from "@/types"
import { create } from "zustand"

type ShiftState = {
    shifts: Shift[]
    loadShifts: (companyPlantId?: string) => Promise<void>
     addShift: (data: Partial<Shift>) => Promise<void>
  updateShift: (id: string, data: Partial<Shift>) => Promise<void>
  deleteShift: (id: string) => Promise<void>


 

}
 function parseApiTime(val: unknown): string {
  if (!val) return '00:00'
  const s = String(val)
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  if (s.includes('T')) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const h = String(d.getUTCHours()).padStart(2, '0')
      const m = String(d.getUTCMinutes()).padStart(2, '0')
      return `${h}:${m}`
    }
  }
  return '00:00'
}

function mapApiShift(s: any): Shift {
  return {
    id: s.id,
    code: s.code,
    name_th: s.name_th,
    name_en: s.name_en,
    type: (s.type === 'ot' ? 'overtime' : s.type) as ShiftType,
    schedule: s.schedule as ShiftSchedule,
    trip_direction: s.trip_direction ?? 'unknown',
    default_time: parseApiTime(s.default_time),
    shift_group_id: s.shift_group_id ?? null,
    shift_groups: s.shift_groups ?? null,
    company_plant_id: s.company_plant_id ?? null,
    is_status: s.is_status,
    created_by: s.created_by ?? null,
    created_at: s.created_at,
    updated_by: s.updated_by ?? null,
    updated_at: s.updated_at ?? null,
  }
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  shifts: [],
 
 
     loadShifts: async (companyPlantId) => {
   const mainStore = useStore.getState()
       
     try {
       const cpId =
         companyPlantId ||
         (isSuperAdmin() ? mainStore.selectedCompanyPlantId : getCompanyPlantId())
   
       const q = cpId ? `&company_plant_id=${cpId}` : ''
   
       const res = await apiFetch(`/api/shifts?limit=200&page=1${q}`, {
         headers: authHeader(),
       })
   
       const json = await res.json()
       console.log("laod_shift",json);
       if (json.success) {
         set({ shifts: (json.data.data ?? []).map(mapApiShift) })
       }
     } catch {
       // keep current state
     }
   },
   
    addShift: async (data) => {
        const mainStore = useStore.getState()
     console.log("addShift",data);
     
     try {
       const cpId =
         data.company_plant_id ||
         (isSuperAdmin() ? mainStore.selectedCompanyPlantId : getCompanyPlantId())
   
   
       if (!cpId) {
         throw new Error('กรุณาเลือกบริษัท/Plant ก่อนเพิ่มกะ')
       }
   
       const payload = {
         code: data.code,
         name_th: data.name_th,
       name_en: data.name_en?.trim() || 'NA',
         type: data.type,
         schedule: data.schedule,
         default_time: data.default_time,
         shift_group_id: data.shift_group_id,
         company_plant_id: cpId,
           status: data.is_status 
       }
   
       const res = await apiFetch('/api/shifts', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', ...authHeader() },
         body: JSON.stringify(payload),
       })
   
       const json = await res.json()
       console.log('create shift response', json)
   
       if (!res.ok || !json.success) {
         throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
       }
   
       set(s => ({
     shifts: [mapApiShift(json.data), ...s.shifts],
   }))
      mainStore.addToast('success', `เพิ่มกะ "${json.data.name_th}" สำเร็จ`)
       mainStore.closeModal()
     } catch (e: any) {
       mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`)
     }
   },
   
     updateShift: async (id, data) => {
        const mainStore = useStore.getState()
       try {
         const body: Record<string, any> = {}
         if (data.code) body.code = data.code
         if (data.name_th) body.name_th = data.name_th
         if (data.name_en) body.name_en = data.name_en
         if (data.type) body.type = data.type
         if (data.schedule) body.schedule = data.schedule
         if (data.trip_direction) body.trip_direction = data.trip_direction
         if (data.default_time) body.default_time = data.default_time
         if (data.shift_group_id !== undefined) body.shift_group_id = data.shift_group_id
         if (data.is_status) body.status = data.is_status
         const res = await apiFetch(`/api/shifts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(body) })
         const json = await res.json()
         if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
         set(s => ({ shifts: s.shifts.map(sh => sh.id === id ? mapApiShift(json.data) : sh) }))
        mainStore.addToast('success', 'อัปเดตกะสำเร็จ')
        mainStore.closeModal()
       } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
     },
   
     deleteShift: async (id) => {
         const mainStore = useStore.getState()
       const sh = get().shifts.find(s => s.id === id)
       try {
         const res = await apiFetch(`/api/shifts/${id}`, { method: 'DELETE', headers: authHeader() })
         const json = await res.json()
         if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
         set(s => ({ shifts: s.shifts.filter(x => x.id !== id) }))
        mainStore.addToast('success', `ลบกะ "${sh?.name_th}" สำเร็จ`)
         mainStore.closeModal()
       } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
     },
  

}))