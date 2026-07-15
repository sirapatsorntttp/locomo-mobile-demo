import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { Calendar, CalendarGroup, Status } from '@/types'
import { create } from 'zustand'

export type CalendarState = {
    calendars: Calendar[]
    calendarGroups: CalendarGroup[]
    loadCalendarGroups: () => Promise<void>
    loadCalendars: () => Promise<void>
    addCalendarGroup: (data: { plant_company_id: string; name: string; color: string; description?: string }) => Promise<CalendarGroup | null>
    updateCalendarGroup: (id: string, data: Partial<CalendarGroup>) => Promise<void>
    deleteCalendarGroup: (id: string) => Promise<void>
    addCalendar: (data: Partial<Calendar>) => Promise<void>
    deleteCalendar: (id: string) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    calendars: [],
    calendarGroups: [],

    loadCalendarGroups: async () => {
    try {
      const res = await apiFetch('/api/calendar-groups?limit=200', { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ calendarGroups: json.data?.data ?? json.data ?? [] })
    } catch { /* keep current state */ }
  },

  loadCalendars: async () => {
    try {
      const res = await apiFetch('/api/calendars?limit=500', { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ calendars: json.data?.data ?? json.data ?? [] })
    } catch { /* keep current state */ }
  },

  addCalendarGroup: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/calendar-groups', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ calendarGroups: [...s.calendarGroups, json.data as CalendarGroup] }))
      mainStore.addToast('success', `สร้างปฏิทิน "${(json.data as CalendarGroup).name}" สำเร็จ`)
      return json.data as CalendarGroup
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`); return null }
  },

  updateCalendarGroup: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/calendar-groups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ calendarGroups: s.calendarGroups.map(g => g.id === id ? json.data as CalendarGroup : g) }))
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteCalendarGroup: async (id) => {
    const mainStore = useStore.getState()
    const grp = get().calendarGroups.find(g => g.id === id)
    try {
      const res = await apiFetch(`/api/calendar-groups/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ calendarGroups: s.calendarGroups.filter(g => g.id !== id), calendars: s.calendars.filter(c => c.calendar_group_id !== id) }))
      mainStore.addToast('success', `ลบปฏิทิน "${grp?.name}" สำเร็จ`)
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  addCalendar: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/calendars', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ calendars: [...s.calendars, json.data as Calendar].sort((a, b) => a.date_at.localeCompare(b.date_at)) }))
      mainStore.addToast('success', `เพิ่มวันหยุด ${(json.data as Calendar).date_at} สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteCalendar: async (id) => {
    const mainStore = useStore.getState()
    const cal = get().calendars.find(c => c.id === id)
    try {
      const res = await apiFetch(`/api/calendars/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ calendars: s.calendars.filter(c => c.id !== id) }))
      mainStore.addToast('success', `ลบ ${cal?.date_at} ออกจากปฏิทินสำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))