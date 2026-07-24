

import { create } from 'zustand'
import { authHeader } from '@/lib/auth-token'
import { apiFetch } from '@/lib/api-fetch'

interface TransportDefault {
  id: string
  trip_direction: 'inbound' | 'outbound'
  route_id: string | null
  point_id: string | null
  route?: { id: string; code: string; name_th: string } | null
  point?: { id: string; name_th: string } | null
}

interface MyTransportState {
  transportDefaults: TransportDefault[]
  loading: boolean
  loadMyProfile: (employeeId: string) => Promise<void>
  updateMyRoute: (
    employeeId: string,
    transportDefaults: {
      trip_direction: 'inbound' | 'outbound'
      route_id?: string
      point_id?: string
    }[],
  ) => Promise<void>
}

export const useMyTransportStore = create<MyTransportState>((set, get) => ({
  transportDefaults: [],
  loading: false,

  // ดึงข้อมูล emp คนเดียว (ตัวเอง)
  loadMyProfile: async (employeeId) => {
    try {
      set({ loading: true })
      const res = await apiFetch(`/api/employees/${employeeId}`, {
        headers: authHeader(),
      })
      const json = await res.json()
      const emp = json.data ?? json

      set({
        transportDefaults: Array.isArray(emp.transport_defaults)
          ? emp.transport_defaults
          : [],
      })
    } finally {
      set({ loading: false })
    }
  },

  // ใช้ PATCH /api/employees/:id แบบเดียวกับ admin เป๊ะ
  updateMyRoute: async (employeeId, transportDefaults) => {
    const res = await apiFetch(`/api/employees/${employeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ transportDefaults }),
    })

    const json = await res.json()
    if (!json.success) {
      throw new Error(json.error ?? json.message ?? 'อัปเดตไม่สำเร็จ')
    }

    // reload
    await get().loadMyProfile(employeeId)
  },
}))