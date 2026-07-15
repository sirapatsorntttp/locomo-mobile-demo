import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"
import { useStore } from "@/lib/store"
import { Plant, Status } from "@/types"
import { create } from "zustand"
import { useCompanyStore } from './company.store'

type PlantState = {
  plants: Plant[]
 
    loadPlants: () => Promise<void>
    addPlant: (data: Partial<Plant> & { company_id?: string }) => Promise<void>
    updatePlant: (id: string, data: Partial<Plant> & { company_id?: string }) => Promise<void>
    deletePlant: (id: string) => Promise<void>
    togglePlantStatus: (id: string) => Promise<void>
  
}


export const usePlantStore = create<PlantState>((set, get) => ({
  plants: [],

  loadPlants: async () => {
    try {
      const res = await apiFetch('/api/plants?limit=500', { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ plants: json.data?.data ?? json.data ?? [] })
    } catch { /* keep current state */ }
  },

  addPlant: async (data) => {
         const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ plants: [json.data as Plant, ...s.plants] }))

    await get().loadPlants?.()
     await useCompanyStore.getState().loadCompanies()
  

      mainStore.addToast('success', `เพิ่มโรงงาน "${(json.data as Plant).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updatePlant: async (id, data) => {
         const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/plants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ plants: s.plants.map(p => p.id === id ? { ...p, ...(json.data as Plant) } : p) }))
     mainStore.addToast('success', 'อัปเดตโรงงานสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deletePlant: async (id) => {
         const mainStore = useStore.getState()
    const p = get().plants.find(x => x.id === id)
    try {
      const res = await apiFetch(`/api/plants/${id}`, { method: 'DELETE', headers: authHeader() })
      console.log("res",res);
      
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ plants: s.plants.filter(x => x.id !== id) }))
      mainStore.addToast('success', `ลบโรงงาน "${p?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  togglePlantStatus: async (id) => {
      const mainStore = useStore.getState()
    const p = get().plants.find(x => x.id === id)
    const next: Status = p?.is_status === 'active' ? 'inactive' : 'active'
    try {
      const res = await apiFetch(`/api/plants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ plants: s.plants.map(x => x.id === id ? { ...x, is_status: next } : x) }))
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },






}))