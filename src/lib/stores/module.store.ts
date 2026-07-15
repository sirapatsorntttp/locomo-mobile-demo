import { create } from 'zustand'
import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import type { Module } from '@/types'

type ModuleState = {
  modules: Module[]
  isLoading: boolean

  loadModules: () => Promise<void>
  addModule: (data: Partial<Module>) => Promise<void>
  updateModule: (id: string, data: Partial<Module>) => Promise<void>
  deleteModule: (id: string) => Promise<void>
  hardDeleteModule: (id: string) => Promise<void>
}

export const useModuleStore = create<ModuleState>((set, get) => ({
  modules: [],
  isLoading: false,

  // ─── Load ────────────────────────────────────────────────
  loadModules: async () => {
    const mainStore = useStore.getState()

    try {
      set({ isLoading: true })

      const res = await apiFetch('/api/modules?limit=500', {
        headers: authHeader(),
      })

      const json = await res.json()

      if (!json.success) throw new Error(json.error)

      const modules = json.data?.data ?? json.data ?? []

      set({ modules })
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'โหลดข้อมูล Modules ไม่สำเร็จ',
      )
    } finally {
      set({ isLoading: false })
    }
  },

  // ─── Add ─────────────────────────────────────────────────
  addModule: async (data) => {
    const mainStore = useStore.getState()

    try {
      const res = await apiFetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!json.success)
        throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      const created = json.data as Module

      set(s => ({
        modules: [created, ...s.modules],
      }))

      mainStore.addToast(
        'success',
        `เพิ่ม Module "${created.code}" สำเร็จ`,
      )

      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'เพิ่ม Module ไม่สำเร็จ',
      )
    }
  },

  // ─── Update ──────────────────────────────────────────────
  updateModule: async (id, data) => {
    const mainStore = useStore.getState()

    try {
      const res = await apiFetch(`/api/modules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!json.success)
        throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      const updated = json.data as Module

      set(s => ({
        modules: s.modules.map(m =>
          m.id === id ? updated : m,
        ),
      }))

      mainStore.addToast('success', 'แก้ไข Module สำเร็จ')
      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'แก้ไข Module ไม่สำเร็จ',
      )
    }
  },

  // ─── Soft Delete ─────────────────────────────────────────
  deleteModule: async (id) => {
    const mainStore = useStore.getState()

    try {
      const target = get().modules.find(m => m.id === id)

      const res = await apiFetch(`/api/modules/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      })

      const json = await res.json()

      if (!json.success)
        throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      set(s => ({
        modules: s.modules.map(m =>
          m.id === id ? { ...m, is_status: 'inactive' } : m,
        ),
      }))

      mainStore.addToast(
        'success',
        `ปิดใช้งาน Module "${target?.code}" สำเร็จ`,
      )

      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'ลบ Module ไม่สำเร็จ',
      )
    }
  },

  // ─── Hard Delete ─────────────────────────────────────────
  hardDeleteModule: async (id) => {
    const mainStore = useStore.getState()

    try {
      const target = get().modules.find(m => m.id === id)

      const res = await apiFetch(`/api/modules/${id}/hard`, {
        method: 'DELETE',
        headers: authHeader(),
      })

      const json = await res.json()

      if (!json.success)
        throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      set(s => ({
        modules: s.modules.filter(m => m.id !== id),
      }))

      mainStore.addToast(
        'success',
        `ลบ Module "${target?.code}" สำเร็จ`,
      )

      mainStore.closeModal()
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'ลบ Module ไม่สำเร็จ',
      )
    }
  },
}))