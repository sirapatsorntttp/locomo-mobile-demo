
import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"
import { useStore } from "@/lib/store"
import { ShiftGroup } from "@/types"
import { create } from "zustand"

type ShiftGroupState = {
   shiftGroups: ShiftGroup[]

     loadShiftGroups: (companyPlantId?: string) => Promise<void>
  addShiftGroup: (data: Partial<ShiftGroup> & { company_plant_id?: string }) => Promise<void>
  updateShiftGroup: (id: string, data: Partial<ShiftGroup>) => Promise<void>
  deleteShiftGroup: (id: string) => Promise<void>
}

export const useShiftGroupStore = create<ShiftGroupState>((set, get) => ({

     shiftGroups: [],

  loadShiftGroups: async (companyPlantId) => {
    try {
      const q = companyPlantId ? `&company_plant_id=${companyPlantId}` : ''
      const res = await apiFetch(`/api/shift-groups?limit=200&page=1${q}`, { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ shiftGroups: json.data.data ?? [] })
    } catch { /* keep current state */ }
  },

  addShiftGroup: async (data) => {
      const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/shift-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, company_plant_id: data.company_plant_id ?? null }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ shiftGroups: [json.data as ShiftGroup, ...s.shiftGroups] }))
      mainStore.addToast('success', `เพิ่มกลุ่มกะ "${(json.data as ShiftGroup).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateShiftGroup: async (id, data) => {
      const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/shift-groups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ shiftGroups: s.shiftGroups.map(g => g.id === id ? json.data as ShiftGroup : g) }))
      mainStore.addToast('success', 'อัปเดตกลุ่มกะสำเร็จ')
     mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteShiftGroup: async (id) => {
      const mainStore = useStore.getState()
    const g = get().shiftGroups.find(x => x.id === id)
    try {
      const res = await apiFetch(`/api/shift-groups/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ shiftGroups: s.shiftGroups.filter(x => x.id !== id) }))
     mainStore.addToast('success', `ลบกลุ่มกะ "${g?.name_th}" สำเร็จ`)
     mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

}))