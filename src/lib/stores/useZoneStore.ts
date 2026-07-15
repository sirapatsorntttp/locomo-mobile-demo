import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { Zone, Status } from '@/types'
import { create } from 'zustand'

export type ZoneState = {
    zones: Zone[]
    loadZones: () => Promise<void>
    addZone: (data: Partial<Zone>) => Promise<void>
    updateZone: (id: string, data: Partial<Zone>) => Promise<void>
    deleteZone: (id: string) => Promise<void>
    toggleZoneStatus: (id: string) => Promise<void>
    assignRouteToZone: (zone_id: string, route_id: string) => Promise<void>
    assignRoutesToZone: (zone_id: string, route_ids: string[]) => Promise<void>
    removeRouteFromZone: (zone_id: string, route_id: string) => Promise<void>
}

export const useZoneStore = create<ZoneState>((set, get) => ({
    zones: [],

    loadZones: async () => {
    try {
      const res = await apiFetch('/api/zones?limit=200', { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ zones: json.data?.data ?? json.data ?? [] })
    } catch { /* keep current state */ }
  },

  addZone: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/zones', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ zones: [json.data as Zone, ...s.zones] }))
      mainStore.addToast('success', `เพิ่มโซน "${(json.data as Zone).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateZone: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/zones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...(json.data as Zone) } : z) }))
      mainStore.addToast('success', 'อัปเดตโซนสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteZone: async (id) => {
    const mainStore = useStore.getState()
    const z = get().zones.find(x => x.id === id)
    try {
      const res = await apiFetch(`/api/zones/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ zones: s.zones.filter(x => x.id !== id) }))
      mainStore.addToast('success', `ลบโซน "${z?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  toggleZoneStatus: async (id) => {
    const mainStore = useStore.getState()
    const z = get().zones.find(x => x.id === id)
    const next: Status = z?.is_status === 'active' ? 'inactive' : 'active'
    try {
      const res = await apiFetch(`/api/zones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ zones: s.zones.map(x => x.id === id ? { ...x, is_status: next } : x) }))
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  assignRouteToZone: async (zone_id, route_id) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/zones/${zone_id}/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ route_id }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadZones()
      mainStore.addToast('success', 'เพิ่มสายรถในโซนสำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  assignRoutesToZone: async (zone_id, route_ids) => {
    const mainStore = useStore.getState()
    try {
      await Promise.all(route_ids.map(route_id =>
        apiFetch(`/api/zones/${zone_id}/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ route_id }) })
      ))
      await get().loadZones()
      mainStore.addToast('success', `เพิ่มสายรถ ${route_ids.length} สายในโซนสำเร็จ`)
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  removeRouteFromZone: async (zone_id, route_id) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/zones/${zone_id}/routes/${route_id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      await get().loadZones()
      mainStore.addToast('success', 'ลบสายรถออกจากโซนสำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))