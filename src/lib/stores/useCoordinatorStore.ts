import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { Coordinator, CoordinatorType, Status } from '@/types'
import { create } from 'zustand'

export type CoordinatorState = {
  coordinatorTypes: CoordinatorType[]
  coordinators: Coordinator[]
  loadCoordinators: () => Promise<void>
  addCoordinatorType: (data: Partial<CoordinatorType>) => Promise<void>
  updateCoordinatorType: (id: string, data: Partial<CoordinatorType>) => Promise<void>
  deleteCoordinatorType: (id: string) => Promise<void>
  addCoordinator: (data: Partial<Coordinator>) => Promise<void>
  updateCoordinator: (id: string, data: Partial<Coordinator>) => Promise<void>
  deleteCoordinator: (id: string) => Promise<void>
  toggleCoordinatorStatus: (id: string) => Promise<void>
}

export const useCoordinatorStore = create<CoordinatorState>((set, get) => ({
  coordinatorTypes: [],
  coordinators: [],

  loadCoordinators: async () => {
    try {
      const [ctRes, cRes] = await Promise.all([apiFetch('/api/coordinator-types?limit=200', { headers: authHeader() }), apiFetch('/api/coordinators?limit=200', { headers: authHeader() })])
      const [ctJson, cJson] = await Promise.all([ctRes.json(), cRes.json()])
      if (ctJson.success) set({ coordinatorTypes: ctJson.data?.data ?? ctJson.data ?? [] })
      if (cJson.success) set({ coordinators: cJson.data?.data ?? cJson.data ?? [] })
    } catch { /* keep current state */ }
  },

  addCoordinatorType: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/coordinator-types', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ coordinatorTypes: [json.data as CoordinatorType, ...s.coordinatorTypes] }))
      mainStore.addToast('success', `เพิ่มประเภทผู้ประสานงาน "${(json.data as CoordinatorType).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateCoordinatorType: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/coordinator-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ coordinatorTypes: s.coordinatorTypes.map(t => t.id === id ? json.data as CoordinatorType : t) }))
      mainStore.addToast('success', 'อัปเดตประเภทผู้ประสานงานสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteCoordinatorType: async (id) => {
    const ct = get().coordinatorTypes.find(x => x.id === id)
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/coordinator-types/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ coordinatorTypes: s.coordinatorTypes.filter(x => x.id !== id) }))
      mainStore.addToast('success', `ลบประเภทผู้ประสานงาน "${ct?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  addCoordinator: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/coordinators', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ coordinators: [json.data as Coordinator, ...s.coordinators] }))
      mainStore.addToast('success', `เพิ่มผู้ประสานงาน "${(json.data as Coordinator).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateCoordinator: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/coordinators/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ coordinators: s.coordinators.map(c => c.id === id ? { ...c, ...(json.data as Coordinator) } : c) }))
      mainStore.addToast('success', 'อัปเดตผู้ประสานงานสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteCoordinator: async (id) => {
    const c = get().coordinators.find(x => x.id === id)
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/coordinators/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ coordinators: s.coordinators.map(x => x.id === id ? { ...x, is_status: 'inactive' as Status } : x) }))
      mainStore.addToast('success', `ลบผู้ประสานงาน "${c?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  toggleCoordinatorStatus: async (id) => {
    const mainStore = useStore.getState()
    const c = get().coordinators.find(x => x.id === id)
    const next: Status = c?.is_status === 'active' ? 'inactive' : 'active'
    try {
      const res = await apiFetch(`/api/coordinators/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ coordinators: s.coordinators.map(x => x.id === id ? { ...x, is_status: next } : x) }))
      mainStore.addToast('success', `อัปเดตสถานะผู้ประสานงาน "${c?.name_th}" สำเร็จ`)
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))