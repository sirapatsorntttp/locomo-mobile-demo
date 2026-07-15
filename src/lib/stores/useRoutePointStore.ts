import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { Route, Point, Status } from '@/types'
import { create } from 'zustand'

function normalizePoint(p: any): Point {
  return {
    ...p,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    queue_default: p.queue_default != null ? Number(p.queue_default) : null,
  }
}

export type RouteState = {
  routes: Route[]
  points: Point[]
  loadRoutesPoints: () => Promise<void>
  addRoute: (data: Partial<Route>) => Promise<void>
  updateRoute: (id: string, data: Partial<Route>) => Promise<void>
  deleteRoute: (id: string) => Promise<void>
  toggleRouteStatus: (id: string) => Promise<void>

  addPoint: (data: Partial<Point>) => Promise<void>
  updatePoint: (id: string, data: Partial<Point>) => Promise<void>
  deletePoint: (id: string) => Promise<void>
}

export const useRoutePointStore = create<RouteState>((set, get) => ({
  routes: [],
  points: [],

  loadRoutesPoints: async () => {
    try {
      const headers = authHeader()
      const [rRes, pRes] = await Promise.all([apiFetch('/api/routes?limit=200&page=1', { headers }), apiFetch('/api/points?limit=500&page=1', { headers })])
      const [rJson, pJson] = await Promise.all([rRes.json(), pRes.json()])
      if (rJson.success) set({ routes: rJson.data.data ?? [] })
      if (pJson.success) set({ points: (pJson.data.data ?? []).map(normalizePoint) })
    } catch { /* keep current state */ }
  },

  addRoute: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/routes', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, trip_direction: data.trip_direction ?? 'unknown', status: data.is_status ?? 'active' }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ routes: [json.data as Route, ...s.routes] }))
      mainStore.addToast('success', `เพิ่มเส้นทาง "${(json.data as Route).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateRoute: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/routes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, trip_direction: data.trip_direction, status: data.is_status }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ routes: s.routes.map(r => r.id === id ? { ...r, ...(json.data as Route) } : r) }))
      mainStore.addToast('success', 'อัปเดตเส้นทางสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteRoute: async (id) => {
    const mainStore = useStore.getState()
    const route = get().routes.find(r => r.id === id)
    try {
      const res = await apiFetch(`/api/routes/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ routes: s.routes.filter(r => r.id !== id) }))
      mainStore.addToast('success', `ลบเส้นทาง "${route?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  toggleRouteStatus: async (id) => {
    const mainStore = useStore.getState()
    const route = get().routes.find(r => r.id === id)
    const next: Status = route?.is_status === 'active' ? 'inactive' : 'active'
    try {
      const res = await apiFetch(`/api/routes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ routes: s.routes.map(r => r.id === id ? { ...r, is_status: next } : r) }))
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  // ── Points ────────────────────────────────────────────────────────────────────
  addPoint: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/points', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ route_id: data.route_id, code: data.code, name_th: data.name_th, name_en: data.name_en, latitude: data.latitude ?? 13.7563, longitude: data.longitude ?? 100.5018, queue_default: data.queue_default ?? null, status: data.is_status ?? 'active' }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      const point = normalizePoint(json.data)
      set(s => ({ points: [...s.points, point], routes: s.routes.map(r => r.id === point.route_id ? { ...r, points: [...(r.points ?? []), point] } : r) }))
      mainStore.addToast('success', `เพิ่มจุดจอด "${point.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updatePoint: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/points/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, latitude: data.latitude, longitude: data.longitude, queue_default: data.queue_default, status: data.is_status }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ points: s.points.map(p => p.id === id ? normalizePoint({ ...p, ...json.data }) : p) }))
      mainStore.addToast('success', 'อัปเดตจุดจอดสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deletePoint: async (id) => {
    const mainStore = useStore.getState()
    const pt = get().points.find(p => p.id === id)
    try {
      const res = await apiFetch(`/api/points/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ points: s.points.filter(p => p.id !== id) }))
      mainStore.addToast('success', `ลบจุดจอด "${pt?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))

