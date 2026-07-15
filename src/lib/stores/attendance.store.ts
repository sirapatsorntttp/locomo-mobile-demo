import { Attendance } from "@/types"
import { create } from "zustand"
import { useStore } from "../store"
import { apiFetch } from "../api-fetch"
import { authHeader } from "../auth-token"

type AttendanceState = {

     attendances: Attendance[]
     
  isLoading: boolean

  loadAttendances: (from?: string, to?: string) => Promise<void>
  addAttendance: (data: Partial<Attendance>) => Promise<Attendance | null>
  updateAttendance: (id: string, data: Partial<Attendance>) => Promise<void>
  deleteAttendance: (id: string) => Promise<void>

}

const mapAttendance = (a: any): Attendance => ({
  ...a,
  employee: a.employees ?? a.employee,
  post: a.posts ?? a.post,
  route: a.routes ?? a.route,
  point: a.points ?? a.point,
})

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
attendances: [],
  isLoading: false,

 loadAttendances: async (from, to) => {
    const mainStore = useStore.getState()

    try {
         if (get().isLoading) return
      set({ isLoading: true })

      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      query.set('limit', '500')

      const res = await apiFetch(`/api/attendances?${query}`, {
        headers: authHeader(),
      })

      const json = await res.json()

      if (!json.success) throw new Error(json.error)

      const list = (json.data?.data ?? json.data ?? []).map(mapAttendance)

      set({ attendances: list })
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'โหลด Attendance ไม่สำเร็จ',
      )
    } finally {
      set({ isLoading: false })
    }
  },

  // ─── Add ─────────────────────────────────────────
  addAttendance: async (data) => {
    const mainStore = useStore.getState()

    try {
      const res = await apiFetch('/api/attendances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!json.success)
        throw new Error(json.error ?? 'เพิ่ม Attendance ไม่สำเร็จ')

      const created = mapAttendance(json.data)

      set(s => ({
        attendances: [created, ...s.attendances],
      }))

      mainStore.addToast('success', 'เพิ่ม Attendance สำเร็จ')
      mainStore.closeModal()

      return created
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'เพิ่ม Attendance ไม่สำเร็จ',
      )
      return null
    }
  },

  // ─── Update ──────────────────────────────────────
  updateAttendance: async (id, data) => {
    const mainStore = useStore.getState()

    try {
      const res = await apiFetch(`/api/attendances/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!json.success)
        throw new Error(json.error ?? 'แก้ไข Attendance ไม่สำเร็จ')

      const updated = mapAttendance(json.data)

      set(s => ({
        attendances: s.attendances.map(a =>
          a.id === id ? updated : a,
        ),
      }))

      mainStore.addToast('success', 'แก้ไข Attendance สำเร็จ')
      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'แก้ไข Attendance ไม่สำเร็จ',
      )
    }
  },

  // ─── Delete ──────────────────────────────────────
  deleteAttendance: async (id) => {
    const mainStore = useStore.getState()

    try {
      const target = get().attendances.find(a => a.id === id)

      const res = await apiFetch(`/api/attendances/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      })

      const json = await res.json()

      if (!json.success)
        throw new Error(json.error ?? 'ลบ Attendance ไม่สำเร็จ')

      set(s => ({
        attendances: s.attendances.filter(a => a.id !== id),
      }))

      mainStore.addToast(
        'success',
        `ลบ Attendance ${target?.rfid ?? ''} สำเร็จ`,
      )

      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'ลบ Attendance ไม่สำเร็จ',
      )
    }
  },
}))
