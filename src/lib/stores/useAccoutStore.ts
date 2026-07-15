import { apiFetch } from '@/lib/api-fetch'
import { authHeader, getPlantIds, isSuperAdmin } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import { UserAccount, UserRole, Status } from '@/types'
import { create } from 'zustand'
import { useRoleStore } from '@/lib/stores/roles.store'
import { useEmployeeStore } from '@/lib/stores/employee.store';
import { useDriverStore } from '@/lib/stores/driver.store';

export type AccountState = {
  userAccounts: UserAccount[]
  loadUserAccounts: () => Promise<void>
  addUserAccount: (data: Partial<UserAccount> & { employeeId?: string; driverId?: string; roleIds?: string[]; roleId?: string; password?: string; language?: string }) => Promise<void>
  bulkAddUserAccounts: (params: {
    account_type: 'employee' | 'driver'
    ids: string[]                      // employee_id[] or driver_id[]
    role: UserRole
    company_id: string | null
    username_pattern: 'code' | 'firstname' | 'custom_prefix'
    custom_prefix?: string
    email_domain?: string              // e.g. "@tttp.co.th" â†’ auto fill email
  }) => Promise<{ created: number; skipped: number }>
  updateUserAccount: (id: string, data: Partial<UserAccount> & { type?: string }) => Promise<void>
  deleteUserAccount: (id: string) => Promise<void>
  toggleUserAccountStatus: (id: string) => Promise<void>
  resetUserPassword: (id: string, newPassword: string) => Promise<void>
}

export const mainStore = useStore.getState()
export const Role = useRoleStore.getState()

export const useAccountStore = create<AccountState>((set, get) => ({
  userAccounts: [],
  loadUserAccounts: async () => {
    try {
      const plantIds = isSuperAdmin() ? [] : getPlantIds()
      const plantQuery = plantIds.length ? `&company_plant_ids=${plantIds.join(',')}` : ''
      const res = await apiFetch(`/api/users?limit=500${plantQuery}`, { headers: authHeader() })
      const json = await res.json()
      if (json.success) set({ userAccounts: json.data?.data ?? json.data ?? [] })
    } catch { /* keep current state */ }
  },

  addUserAccount: async (data: any) => {
    try {
      const isDriver = data.account_type === 'driver'
      const endpoint = isDriver ? '/api/users/driver' : '/api/users/employee'
      const roleId = data.role ? Role.roles.find(r => r.type === data.role)?.id : undefined
      const payload = isDriver
        ? { driverId: data.driver_id, username: data.username, password: data.password ?? '123456789' }
        : { employeeId: data.employee_id, username: data.username, password: data.password ?? '123456789', roleIds: roleId ? [roleId] : undefined }
      const res = await apiFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
      set(s => ({ userAccounts: [json.data as UserAccount, ...s.userAccounts] }))
      mainStore.addToast('success', `สร้าง Account "${(json.data as UserAccount).username}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  bulkAddUserAccounts: async ({ account_type, ids, role, company_id, username_pattern, custom_prefix, email_domain }) => {
    const { drivers } = useDriverStore()
    const { employees } = useEmployeeStore()
    const { roles } = useRoleStore()
    const { userAccounts } = useAccountStore()
    const roleId = role ? roles.find(r => r.type === role)?.id : undefined
    const existingEmpIds = new Set(userAccounts.map(u => u.employee_id).filter(Boolean))
    const existingDrvIds = new Set(userAccounts.map(u => u.driver_id).filter(Boolean))

    if (account_type === 'employee') {
      const seenUsernames = new Set<string>()
      const items = ids
        .filter(id => !existingEmpIds.has(id))
        .map(id => {
          const emp = employees.find(e => e.id === id)
          if (!emp) return null
          const safeFirstEn = (emp.first_name_en || '').toLowerCase()
          const safeLastEn = (emp.last_name_en || '').toLowerCase()
          const base = username_pattern === 'code'
            ? emp.code.toLowerCase()
            : username_pattern === 'firstname'
              ? (safeFirstEn && safeLastEn)
                ? `${safeFirstEn}.${safeLastEn.charAt(0)}`
                : emp.code.toLowerCase()
              : `${custom_prefix ?? 'user'}.${emp.code.toLowerCase()}`
          if (seenUsernames.has(base)) return null
          seenUsernames.add(base)
          return { employeeId: emp.id, username: base, password: '123456789', roleIds: roleId ? [roleId] : undefined, language: 'th' }
        })
        .filter(Boolean)

      const skipped = ids.length - items.length
      const res = await apiFetch('/api/users/bulk-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      const result = json.data ?? { created: 0, skippedHasAccount: 0, skippedUsernameTaken: 0, skippedNotFound: 0, failed: 0 }
      const frontendSkipped = ids.length - items.length
      const parts: string[] = []
      if ((result.skippedHasAccount ?? 0) > 0) parts.push(`มี Account แล้ว ${result.skippedHasAccount} คน`)
      if ((result.skippedUsernameTaken ?? 0) > 0) parts.push(`Username ซ้ำ ${result.skippedUsernameTaken} คน`)
      if ((result.skippedNotFound ?? 0) > 0) parts.push(`ไม่พบข้อมูล ${result.skippedNotFound} คน`)
      if (frontendSkipped > 0) parts.push(`ข้ามซ้ำ ${frontendSkipped} คน`)
      if ((result.failed ?? 0) > 0) parts.push(`ผิดพลาด ${result.failed} คน`)
      const skipDetail = parts.length > 0 ? ` (${parts.join(', ')})` : ''
      mainStore.addToast('success', `สร้าง ${result.created} Account สำเร็จ${skipDetail}`)
      await get().loadUserAccounts()
    } else {
      // driver: still sequential (usually small batch)
      let created = 0, skipped = 0
      for (const id of ids) {
        try {
          if (existingDrvIds.has(id)) { skipped++; continue }
          const drv = drivers.find(d => d.id === id)
          if (!drv) { skipped++; continue }
          const firstName = drv.first_name_en?.toLowerCase() || drv.code.toLowerCase()
          const lastName = drv.last_name_en?.toLowerCase() || ''
          const base = username_pattern === 'code' ? drv.code.toLowerCase() : username_pattern === 'firstname' ? (lastName ? `${firstName}.${lastName.charAt(0)}` : firstName) : `${custom_prefix ?? 'drv'}.${drv.code.toLowerCase()}`
          const res = await apiFetch('/api/users/driver', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ driverId: drv.id, username: base, password: '123456789' }) })
          const json = await res.json()
          if (!json.success) { skipped++; continue }
          set(s => ({ userAccounts: [json.data as UserAccount, ...s.userAccounts] }))
          existingDrvIds.add(id)
          created++
        } catch { skipped++ }
      }
      mainStore.addToast('success', `สร้าง ${created} Account สำเร็จ${skipped > 0 ? ` (ข้าม ${skipped} รายการ)` : ''}`)
    }

    mainStore.closeModal()
    return { created: 0, skipped: 0 }
  },

  updateUserAccount: async (id, data: any) => {
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ userAccounts: s.userAccounts.map(a => a.id === id ? { ...a, ...(json.data as UserAccount) } : a) }))
      mainStore.addToast('success', 'อัปเดต Account สำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  deleteUserAccount: async (id) => {
    const ua = get().userAccounts.find(a => a.id === id)
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE', headers: authHeader() })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ userAccounts: s.userAccounts.map(a => a.id === id ? { ...a, is_status: 'inactive' as Status } : a) }))
      mainStore.addToast('success', `ปิดใช้งาน Account "${ua?.username}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  resetUserPassword: async (id, newPassword) => {
    try {
      const res = await apiFetch(`/api/users/${id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ newPassword }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      mainStore.addToast('success', 'รีเซ็ตรหัสผ่านสำเร็จ')
      mainStore.closeModal()
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },

  toggleUserAccountStatus: async (id) => {
    const ua = get().userAccounts.find(a => a.id === id)
    const next: Status = ua?.is_status === 'active' ? 'inactive' : 'active'
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ userAccounts: s.userAccounts.map(a => a.id === id ? { ...a, is_status: next } : a) }))
    } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  },
}))