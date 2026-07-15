import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { OrganizationLevel, OrganizationUnit, Status } from '@/types'
import { create } from 'zustand'

export type OrganizeState = {
  orgLevels: OrganizationLevel[]
  orgUnits: OrganizationUnit[]
  loadOrganization: () => Promise<void>
  addOrgLevel: (data: Partial<OrganizationLevel>) => Promise<void>
  updateOrgLevel: (id: string, data: Partial<OrganizationLevel>) => Promise<void>
  deleteOrgLevel: (id: string) => Promise<void>
  addOrgUnit: (data: Partial<OrganizationUnit>) => Promise<void>
  updateOrgUnit: (id: string, data: Partial<OrganizationUnit>) => Promise<void>
  deleteOrgUnit: (id: string) => Promise<void>
}

export const useOrganizeStore = create<OrganizeState>((set, get) => ({
  orgLevels: [],
  orgUnits: [],

  loadOrganization: async () => {
    try {
      const [olRes, ouRes] = await Promise.all([apiFetch('/api/organization-levels?limit=200', { headers: authHeader() }), apiFetch('/api/organization-units?limit=500', { headers: authHeader() })])
      const [olJson, ouJson] = await Promise.all([olRes.json(), ouRes.json()])
      if (olJson.success) set({ orgLevels: olJson.data?.data ?? olJson.data ?? [] })
      if (ouJson.success) set({ orgUnits: ouJson.data?.data ?? ouJson.data ?? [] })
    } catch { /* keep current state */ }
  },

  addOrgLevel: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/organization-levels', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ orgLevels: [json.data as OrganizationLevel, ...s.orgLevels] }))
      mainStore.addToast('success', `เพิ่มระดับองค์กร "${(json.data as OrganizationLevel).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateOrgLevel: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/organization-levels/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ orgLevels: s.orgLevels.map(l => l.id === id ? { ...l, ...(json.data as OrganizationLevel) } : l) }))
      mainStore.addToast('success', 'อัปเดตระดับองค์กรสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteOrgLevel: async (id) => {
    const mainStore = useStore.getState()
    const l = get().orgLevels.find(x => x.id === id)
    try {
      const res = await apiFetch(`/api/organization-levels/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ orgLevels: s.orgLevels.filter(x => x.id !== id) }))
      mainStore.addToast('success', `ลบระดับองค์กร "${l?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  addOrgUnit: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/organization-units', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ orgUnits: [json.data as OrganizationUnit, ...s.orgUnits] }))
      mainStore.addToast('success', `เพิ่มหน่วยงาน "${(json.data as OrganizationUnit).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateOrgUnit: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/organization-units/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ orgUnits: s.orgUnits.map(u => u.id === id ? { ...u, ...(json.data as OrganizationUnit) } : u) }))
      mainStore.addToast('success', 'อัปเดตหน่วยงานสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteOrgUnit: async (id) => {
    const mainStore = useStore.getState()
    const u = get().orgUnits.find(x => x.id === id)
    try {
      const res = await apiFetch(`/api/organization-units/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ orgUnits: s.orgUnits.filter(x => x.id !== id) }))
      mainStore.addToast('success', `ลบหน่วยงาน "${u?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))