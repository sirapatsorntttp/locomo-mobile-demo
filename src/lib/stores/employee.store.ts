

import { create } from 'zustand'
import type { EmployeeFull, Status } from '@/types'
import { authHeader, getPlantIds, isSuperAdmin, getCompanyPlantId } from '@/lib/auth-token'
import { apiFetch } from '@/lib/api-fetch'
import { useStore } from '../store' 

export const BACKEND_URL =process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'
 type EmployeeState = {
  employees: EmployeeFull[]
  employeeLoading: boolean

  loadEmployees: () => Promise<void>
  addEmployee: (data: Partial<EmployeeFull> & { defaults?: any; transportDefaults?: any[] }) => Promise<void>
  updateEmployee: (id: string, data: Partial<EmployeeFull> & { transportDefaults?: any[] }) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>
  toggleEmployeeStatus: (id: string) => Promise<void>
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  employeeLoading: false,

  loadEmployees: async () => {
    try {
      set({ employeeLoading: true })

      const plantIds = isSuperAdmin() ? [] : getPlantIds()
      const plantQuery = plantIds.length ? `&company_plant_ids=${plantIds.join(',')}` : ''

      const res = await apiFetch(`/api/employees?limit=500${plantQuery}`, {
        headers: authHeader(),
      })

      const json = await res.json()
      const raw: any[] = json.data?.data ?? json.data ?? []

      if (json.success && Array.isArray(raw)) {
        set({
          employees: raw.map((e: any) => ({
            ...e,
            transport_defaults: Array.isArray(e.transport_defaults)
              ? e.transport_defaults
              : [],
          })),
        })
      }
    } finally {
      set({ employeeLoading: false })
    }
  },

  addEmployee: async (data) => {
    const mainStore = useStore.getState()

    try {
      const cpId =
        data.company_plant_id ||
        (isSuperAdmin()
          ? mainStore.selectedCompanyPlantId
          : getCompanyPlantId())

      if (!cpId) {
        throw new Error('กรุณาเลือกบริษัท/Plant ก่อนเพิ่มพนักงาน')
      }

      const cleanedData = {
        code: data.code,
      rfid: data.rfid?.trim() || undefined,

      firstNameTh: data.first_name_th,
      lastNameTh: data.last_name_th,
      firstNameEn: data.first_name_en?.trim() || 'NA',
      lastNameEn: data.last_name_en?.trim() || 'NA',

      email: data.email?.trim() || undefined,
      company_plant_id: cpId,
      organization_unit_id: data.organization_unit_id || undefined,
      level_id: data.level_id || undefined,
      transportDefaults: data.transportDefaults ?? [],
    }



     
const res = await apiFetch('/api/employees', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...authHeader(),
  },
  body: JSON.stringify(cleanedData),
})


      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
      }

      mainStore.addToast('success', 'เพิ่มพนักงานสำเร็จ')
      await get().loadEmployees()
      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
      throw err
    }
  },

  updateEmployee: async (id, data) => {
    const mainStore = useStore.getState()

    try {
      const res = await apiFetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(data),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      mainStore.addToast('success', 'อัปเดตข้อมูลพนักงานสำเร็จ')
      mainStore.closeModal()
      await get().loadEmployees()
    } catch (err: any) {
      mainStore.addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
      throw err
    }
  },

  deleteEmployee: async (id) => {
    const mainStore = useStore.getState()

    try {
      const res = await apiFetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      set((s) => ({
        employees: s.employees.filter((e) => e.id !== id),
      }))

      mainStore.addToast('success', 'ลบพนักงานสำเร็จ')
      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
      throw err
    }
  },

  toggleEmployeeStatus: async (id) => {
    const mainStore = useStore.getState()

    const emp = get().employees.find((e) => e.id === id)
    const next: Status = emp?.is_status === 'active' ? 'inactive' : 'active'

    try {
      const res = await apiFetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ is_status: next }),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      set((s) => ({
        employees: s.employees.map((e) =>
          e.id === id ? { ...e, is_status: next } : e
        ),
      }))

      mainStore.addToast('info', 'เปลี่ยนสถานะพนักงานสำเร็จ')
    } catch (err: any) {
      mainStore.addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
    }
  },
}))