import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { JobLevel, Status } from '@/types'
import { create } from 'zustand'

export type JobLevelState = {
  jobLevels: JobLevel[]
  loadJobLevels: () => Promise<void>
  addJobLevel: (data: Partial<JobLevel>) => Promise<void>
  updateJobLevel: (id: string, data: Partial<JobLevel>) => Promise<void>
  deleteJobLevel: (id: string) => Promise<void>
}

export const useLevelStore = create<JobLevelState>((set, get) => ({
  jobLevels: [],

  loadJobLevels: async () => {
    try {
      const res = await apiFetch('/api/levels?limit=200', { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ jobLevels: json.data?.data ?? json.data ?? [] })
    } catch { /* keep current state */ }
  },

  addJobLevel: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/levels', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ jobLevels: [json.data as JobLevel, ...s.jobLevels] }))
      mainStore.addToast('success', `เพิ่มระดับ "${(json.data as JobLevel).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateJobLevel: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/levels/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ jobLevels: s.jobLevels.map(l => l.id === id ? { ...l, ...(json.data as JobLevel) } : l) }))
      mainStore.addToast('success', 'อัปเดตระดับสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteJobLevel: async (id) => {
    const l = get().jobLevels.find(x => x.id === id)
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/levels/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ jobLevels: s.jobLevels.filter(x => x.id !== id) }))
      mainStore.addToast('success', `ลบระดับ "${l?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))