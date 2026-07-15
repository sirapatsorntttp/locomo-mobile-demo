import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"

import { AuthenticationLog, Reserve, ReserveStatus } from "@/types"
import { create } from "zustand"
import { useEmployeeStore } from "./employee.store"
import { useShiftStore } from "./shift.store"
import { useStore } from "@/lib/store"


type ReserveState = {
     reserves: Reserve[]
     _reserveParams: Record<string, string>
      loadReserves: (params?: { date_from?: string; date_to?: string; shift_id?: string; is_state?: string; employee_id?: string; page?: number; per_page?: number }) => Promise<void>
  addReserve: (data: Partial<Reserve> & { policy_id?: string; date_from?: string; date_to?: string }) => Promise<void>
  bulkAddReserves: (params: {
    employee_ids: string[]
    trip_mode: 'one_way' | 'round_trip'
    legs: Array<{
      shift_id: string
      point_mode: 'default' | 'override'
      override_point_id?: string
    }>
    travel_dates: string[]
    policy_id?: string
    remark?: string
  }) => Promise<{ created: number; updated: number; skipped: number; blocked: number }>
  updateReserveState: (id: string, state: ReserveStatus) => Promise<void>
  deleteReserve: (id: string) => Promise<void>
  bulkApprove: (ids: string[]) => Promise<void>
  bulkCancelReserves: (ids: string[]) => Promise<void>
  bulkEditReserveShift: (ids: string[], shift_id: string) => void
  
}

function normalizeReserve(r: any): Reserve {
  return {
    ...r,
    employee:              r.employees   ?? r.employee   ?? undefined,
    shift:                 r.shifts      ?? r.shift      ?? undefined,
    point:                 r.points      ?? r.point      ?? undefined,
    policy:                r.booking_policies ?? r.policy ?? undefined,
    plant_company_zone_id: r.plant_company_zone_id ?? '',
    platform:              r.platform  ?? 'web',
    device:                r.device    ?? 'pc',
    is_state:              r.is_state  ?? 'waiting',
    remark:                r.remark    ?? null,
    is_status:             r.is_status ?? 'active',
    created_by:            r.created_by  ?? '',
    created_at:            r.created_at  ?? new Date().toISOString(),
    updated_by:            r.updated_by  ?? null,
    updated_at:            r.updated_at  ?? null,
  }
}
export const useReserveStore = create<ReserveState>((set, get) => ({
     reserves: [],
  _reserveParams: {} as Record<string, string>,

  loadReserves: async (params) => {
    try {
      // Persist params so paramless calls (e.g. after booking) reuse same filter
      const saved = get()._reserveParams as any
      const p = params ?? saved
      if (params) set({ _reserveParams: params as any })
      const query = new URLSearchParams()
      query.set('per_page', String(p?.per_page ?? 200))
      query.set('page',     String(p?.page     ?? 1))
      if (p?.date_from)   query.set('date_from',   p.date_from)
      if (p?.date_to)     query.set('date_to',     p.date_to)
      if (p?.shift_id)    query.set('shift_id',    p.shift_id)
      if (p?.is_state)    query.set('is_state',    p.is_state)
      if (p?.employee_id) query.set('employee_id', p.employee_id)
      const res  = await apiFetch(`/api/reserves?${query}`)
      const json = await res.json()
      if (json.success) {
        const list = (json.data?.data ?? json.data ?? []) as any[]
        set({ reserves: list.map(normalizeReserve) })
      }
    } catch { /* keep current state */ }
  },

  addReserve: async (data) => {
    const mainStore = useStore.getState()
    try {
      const body = {
        employee_id: data.employee_id,
        shift_id:    data.shift_id,
        point_id:    data.point_id,
        travel_date: data.travel_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        remark:      data.remark ?? undefined,
      }
      const res  = await apiFetch('/api/reserves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      const created = normalizeReserve(json.data)
      set(s => ({ reserves: [created, ...s.reserves] }))
      mainStore.addToast('success', `จองรถสำเร็จ`)
     mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `จองรถไม่สำเร็จ: ${e.message}`) }
  },

  bulkAddReserves: async (params) => {
     const mainStore = useStore.getState()
    const employees = useEmployeeStore.getState().employees
     const shifts = useShiftStore.getState().shifts
    const {  reserves } = get()
    let created = 0, updated = 0, skipped = 0, blocked = 0
    const calls: Promise<void>[] = []

    for (const employee_id of params.employee_ids) {
      const emp = employees.find(e => e.id === employee_id)
      if (!emp) { skipped += params.legs.length * params.travel_dates.length; continue }

      for (const date of params.travel_dates) {
        for (const leg of params.legs) {
          const dir = shifts.find(s => s.id === leg.shift_id)?.trip_direction ?? 'inbound'

          let point_id: string | undefined
          if (leg.point_mode === 'default') {
            point_id = emp.transport_defaults?.find(td => td.trip_direction === dir)?.point_id ?? undefined
          } else {
            point_id = leg.override_point_id
          }
          if (!point_id) { skipped++; continue }

          // Check for existing active reserve: same employee + working_date + direction
          const existing = reserves.find(r =>
            r.employee_id === employee_id &&
            (r.working_date ?? r.travel_date)?.slice(0, 10) === date &&
            r.shift?.trip_direction === dir &&
            r.is_state !== 'canceled' &&
            r.is_state !== 'finished',
          )

          if (existing) {
            // Update existing reserve's shift and point
            calls.push(
              apiFetch(`/api/reserves/${existing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shift_id: leg.shift_id, point_id }),
              }).then(async res => {
                const json = await res.json()
                json.success ? updated++ : blocked++
              }).catch(() => { blocked++ }),
            )
          } else {
            // Create new reserve
            calls.push(
              apiFetch('/api/reserves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id, shift_id: leg.shift_id, point_id, travel_date: date, remark: params.remark }),
              }).then(async res => {
                const json = await res.json()
                json.success ? created++ : blocked++
              }).catch(() => { blocked++ }),
            )
          }
        }
      }
    }

    await Promise.all(calls)
    await get().loadReserves()

    const total = created + updated
    const parts: string[] = []
    if (created > 0) parts.push(`สร้างใหม่ ${created} รายการ`)
    if (updated > 0) parts.push(`อัปเดต ${updated} รายการ`)
    if (blocked > 0) parts.push(`ไม่สำเร็จ ${blocked} รายการ`)
    if (skipped > 0) parts.push(`ข้าม ${skipped} รายการ`)
   mainStore.addToast(total > 0 ? 'success' : 'error', parts.join(' · ') || 'ไม่มีรายการที่ดำเนินการได้')
    mainStore.closeModal()
    return { created, updated, skipped, blocked }
  },

  updateReserveState: async (id, state) => {
     const mainStore = useStore.getState()
    try {
      const res  = await apiFetch(`/api/reserves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      const updated = normalizeReserve(json.data)
      set(s => ({ reserves: s.reserves.map(r => r.id === id ? updated : r) }))
      mainStore.addToast('success', 'เปลี่ยนสถานะสำเร็จ')
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteReserve: async (id) => {
     const mainStore = useStore.getState()
    try {
      const res  = await apiFetch(`/api/reserves/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ reserves: s.reserves.map(r => r.id === id ? { ...r, is_state: 'canceled' as ReserveStatus } : r) }))
     mainStore.addToast('success', 'ยกเลิกรายการจองสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  bulkApprove: async (ids) => {
     const mainStore = useStore.getState()
    try {
      await Promise.all(ids.map(id =>
        apiFetch(`/api/reserves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: 'approved' }) })
      ))
      set(s => ({ reserves: s.reserves.map(r => ids.includes(r.id) && r.is_state === 'waiting' ? { ...r, is_state: 'approved' as ReserveStatus } : r) }))
      mainStore.addToast('success', `อนุมัติ ${ids.length} รายการสำเร็จ`)
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  bulkCancelReserves: async (ids) => {
     const mainStore = useStore.getState()
    try {
      await Promise.all(ids.map(id =>
        apiFetch(`/api/reserves/${id}`, { method: 'DELETE' })
      ))
      set(s => ({ reserves: s.reserves.map(r => ids.includes(r.id) ? { ...r, is_state: 'canceled' as ReserveStatus } : r) }))
      mainStore.addToast('success', `ยกเลิก ${ids.length} รายการสำเร็จ`)
    } catch (e: any) {mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  bulkEditReserveShift: (ids, shift_id) => {
     const mainStore = useStore.getState()
     const shiftStore = useShiftStore.getState().shifts
    

    const shift = shiftStore.find(s => s.id === shift_id)
    if (!shift) return
    set(s => ({ reserves: s.reserves.map(r => ids.includes(r.id) ? { ...r, shift_id, shift } : r) }))
  mainStore.addToast('success', `เปลี่ยนกะเป็น "${shift.name_th}" สำหรับ ${ids.length} รายการสำเร็จ`)
    mainStore.closeModal()
  },
}))