import { apiFetch } from "@/lib/api-fetch"
import { useStore } from "@/lib/store"

import { BookingPolicy} from "@/types"
import { create } from "zustand"

type BookingState = {
  bookingPolicies: BookingPolicy[]
  bookingPoliciesTotal: number
  loadBookingPolicies: (params?: { status?: string; page?: number }) => Promise<void>
  addBookingPolicy: (data: {
    company_id: string; name_th: string; name_en: string; description?: string; priority?: number;
    rules?: Partial<import('@/types').BookingPolicyRules>;
    route_ids?: string[]; org_unit_ids?: string[];
  }) => Promise<void>
  updateBookingPolicy: (id: string, data: {
    name_th?: string; name_en?: string; description?: string; priority?: number; status?: string;
    rules?: Partial<import('@/types').BookingPolicyRules>;
    route_ids?: string[]; org_unit_ids?: string[];
  }) => Promise<void>
  deleteBookingPolicy: (id: string) => Promise<void>
}


export const useBookingStore = create<BookingState>((set, get) => ({

      bookingPolicies: [],
  bookingPoliciesTotal: 0,

    loadBookingPolicies: async (params) => {
    try {
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)
      if (params?.page)   query.set('page', String(params.page))
      query.set('limit', '100')
      const res  = await apiFetch(`/api/booking-policies?${query}`)
      const json = await res.json()
      if (json.success) set({ bookingPolicies: json.data?.data ?? json.data ?? [], bookingPoliciesTotal: json.data?.total ?? 0 })
    } catch { /* keep current state */ }
  },

  addBookingPolicy: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res  = await apiFetch('/api/booking-policies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
      set(s => ({ bookingPolicies: [json.data as BookingPolicy, ...s.bookingPolicies], bookingPoliciesTotal: s.bookingPoliciesTotal + 1 }))
      mainStore.addToast('success', `เพิ่มนโยบาย "${data.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateBookingPolicy: async (id, data) => {
     const mainStore = useStore.getState()
    try {
      const res  = await apiFetch(`/api/booking-policies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
      set(s => ({ bookingPolicies: s.bookingPolicies.map(p => p.id === id ? { ...p, ...(json.data as BookingPolicy) } : p) }))
      mainStore.addToast('success', 'อัปเดตนโยบายสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteBookingPolicy: async (id) => {
     const mainStore = useStore.getState()
    try {
      const pol  = get().bookingPolicies.find(p => p.id === id)
      const res  = await apiFetch(`/api/booking-policies/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
      set(s => ({ bookingPolicies: s.bookingPolicies.filter(p => p.id !== id), bookingPoliciesTotal: s.bookingPoliciesTotal - 1 }))
      mainStore.addToast('success', `ลบนโยบาย "${pol?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))