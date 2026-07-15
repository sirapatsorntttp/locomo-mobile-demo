import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"
import { useStore } from "@/lib/store"
import { Role } from "@/types"
import { create } from "zustand"


type RoleState = {
  roles: Role[]
  loadRoles: () => Promise<void>
  addRole: (data: Partial<Role>) => Promise<void>
  updateRole: (id: string, data: Partial<Role>) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  
}


export const useRoleStore = create<RoleState>((set, get) => ({
  roles: [],

 loadRoles: async () => {
    try {
      const res = await apiFetch('/api/roles?limit=200', { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ roles: json.data?.data ?? json.data ?? [] })
    } catch { /* keep current state */ }
  },

  addRole: async (data) => {
     const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en, type: (data as any).type }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ roles: [json.data as Role, ...s.roles] }))
      mainStore.addToast('success', `เพิ่มบทบาท "${(json.data as Role).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  updateRole: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/roles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ roles: s.roles.map(r => r.id === id ? { ...r, ...(json.data as Role) } : r) }))
     mainStore.addToast('success', 'อัปเดตบทบาทสำเร็จ')
     mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteRole: async (id) => {
    const mainStore = useStore.getState()
    const r = get().roles.find(x => x.id === id)
    try {
      const res = await apiFetch(`/api/roles/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ roles: s.roles.filter(x => x.id !== id) }))
      mainStore.addToast('success', `ลบบทบาท "${r?.name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },






}))