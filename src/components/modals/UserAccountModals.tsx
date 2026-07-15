'use client'
import { useState, useMemo, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useCompanyStore } from '@/lib/stores/company.store'
import { isCompanyAdmin, authHeader } from '@/lib/auth-token'
import { apiFetch } from '@/lib/api-fetch'
import {
  Shield, User2, UserCheck, Building2, Key, Mail, Phone,
  Search, CheckCircle2,
} from 'lucide-react'
import type { UserAccount, UserRole, UserAccountType } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useRoleStore } from '@/lib/stores/roles.store'
import { useAccountStore } from '@/lib/stores/useAccoutStore';
import CompaniesPage from '@/app/dashboard/companies/page';

// ─── Role config ────────────────────────────────────────────────
const ALL_EMPLOYEE_ROLES: { value: UserRole; label: string; desc: string; color: string }[] = [
  { value: 'super_admin', label: 'Super Admin',  desc: 'เข้าถึงทุกบริษัท ทุกฟีเจอร์',      color: 'bg-violet-100 text-violet-700 border-violet-200'  },
  { value: 'admin',       label: 'Admin',         desc: 'จัดการทุกอย่างในบริษัทของตน',      color: 'bg-sky-100    text-sky-700    border-sky-200'      },
  { value: 'operator',    label: 'Operator',      desc: 'จัดการการจอง คนขับ ยานพาหนะ',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200'},
  { value: 'viewer',      label: 'Viewer',        desc: 'ดูข้อมูลได้อย่างเดียว ไม่แก้ไข',   color: 'bg-slate-100  text-slate-600   border-slate-200'   },
  { value: 'employee',    label: 'Employee',      desc: 'พนักงานทั่วไป ใช้งาน App จอง',     color: 'bg-amber-100  text-amber-700   border-amber-200'   },
]

const COMPANY_ADMIN_ROLES: { value: UserRole; label: string; desc: string; color: string }[] = [
  { value: 'employee', label: 'Employee',    desc: 'พนักงานทั่วไป ใช้งาน App จอง',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'admin',    label: 'Admin แผนก', desc: 'จัดการพนักงานและข้อมูลของ Plant', color: 'bg-sky-100   text-sky-700   border-sky-200'   },
]

export function getRoleBadgeVariant(role: UserRole) {
  return role === 'super_admin' ? 'info'
    : role === 'admin'    ? 'success'
    : role === 'operator' ? 'default'
    : role === 'driver'   ? 'info'
    : 'gray' as const
}

export function getRoleLabel(role: UserRole) {
  if (role === 'driver')   return 'Driver'
  if (role === 'employee') return 'Employee'
  return ALL_EMPLOYEE_ROLES.find(r => r.value === role)?.label ?? role
}

// ═══════════════════════════════════════════════════════════════
// ADD USER ACCOUNT  — เลือก Employee หรือ Driver แล้วตั้ง role
// ═══════════════════════════════════════════════════════════════
export function AddUserAccountModal() {
  const { loadCompanies, companies } = useCompanyStore()
  const { loadRoles} = useRoleStore()
  const { employees} = useEmployeeStore()
  const { drivers} = useDriverStore()
  const { modal, closeModal} = useStore()
  const { userAccounts, addUserAccount } = useAccountStore()
  const open = modal.type === 'add-user-account'
  const isCAdmin = isCompanyAdmin()

  const [accountType, setAccountType] = useState<UserAccountType>('employee')
  const [empSearch, setEmpSearch]     = useState('')
  const [selectedId, setSelectedId]   = useState('')
  const [role, setRole]               = useState<UserRole>('employee')
  const [username, setUsername]       = useState('')
  const [companyId, setCompanyId]     = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  // reset on open
  useMemo(() => {
    if (open) {
      setAccountType('employee'); setEmpSearch(''); setSelectedId('')
      setRole('employee'); setUsername(''); setCompanyId('')
      setErrors({})
      loadCompanies()
      loadRoles()
    }
  }, [open])

  // IDs already with an account
  const usedEmpIds = useMemo(() => new Set(userAccounts.map(u => u.employee_id).filter(Boolean)), [userAccounts])
  const usedDrvIds = useMemo(() => new Set(userAccounts.map(u => u.driver_id).filter(Boolean)),   [userAccounts])

  const filteredEmployees = useMemo(() =>
    employees.filter(e =>
      e.is_status === 'active' &&
      `${e.first_name_th} ${e.last_name_th} ${e.code}`.toLowerCase().includes(empSearch.toLowerCase())
    ), [employees, empSearch])

  const filteredDrivers = useMemo(() =>
    drivers.filter(d =>
      d.is_status === 'active' &&
      `${d.first_name_th} ${d.last_name_th} ${d.code}`.toLowerCase().includes(empSearch.toLowerCase())
    ), [drivers, empSearch])

  // Auto-fill username from selected person
  const selectedEmp = employees.find(e => e.id === selectedId)
  const selectedDrv = drivers.find(d => d.id === selectedId)
  const selected = accountType === 'employee' ? selectedEmp : selectedDrv

  const handleSelect = (id: string, defaultUsername: string) => {
    setSelectedId(id)
    if (!username) setUsername(defaultUsername)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (accountType !== 'standalone' && !selectedId) e.selected = 'กรุณาเลือกพนักงาน/คนขับ'
    if (!username.trim()) e.username = 'กรุณากรอก Username'
    if (!isCAdmin && role !== 'super_admin' && role !== 'driver' && role !== 'employee' && !companyId) e.company = 'กรุณาเลือกบริษัท'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = () => {
    if (!validate()) return
    addUserAccount({
      username,
      role,
      account_type: accountType,
      employee_id: accountType === 'employee' ? selectedId : null,
      driver_id:   accountType === 'driver'   ? selectedId : null,
      company_id:  companyId || null,
      password:    '123456789',
    })
  }

  const isSuperAdmin = role === 'super_admin'
  const isDriverRole = accountType === 'driver'

  return (
    <Modal open={open} onClose={closeModal} title="สร้าง User Account ใหม่" size="lg">
      <div className="space-y-5">

        {/* ── Step 1: เลือกประเภท ─────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">1. ประเภทผู้ใช้</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { type: 'employee'   as UserAccountType, label: 'พนักงาน',    icon: <User2 size={14} />,     color: 'violet' },
              { type: 'driver'     as UserAccountType, label: 'คนขับรถ',    icon: <UserCheck size={14} />, color: 'sky'    },
              ...(!isCAdmin ? [{ type: 'standalone' as UserAccountType, label: 'Admin อิสระ', icon: <Shield size={14} />, color: 'indigo' }] : []),
            ]).map(opt => {
              const colorMap: Record<string, string> = {
                violet: 'border-violet-300 bg-violet-50 text-violet-700',
                sky:    'border-sky-300    bg-sky-50    text-sky-700',
                indigo: 'border-indigo-300 bg-indigo-50 text-indigo-700',
              }
              const isActive = accountType === opt.type
              return (
                <button
                  key={opt.type}
                  onClick={() => { setAccountType(opt.type); setSelectedId(''); setEmpSearch('') }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    isActive ? colorMap[opt.color] : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt.icon}
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Step 2: เลือกคน (ถ้าไม่ใช่ standalone) ─────────── */}
        {accountType !== 'standalone' && (
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">
              2. เลือก{accountType === 'employee' ? 'พนักงาน' : 'คนขับ'}
              {errors.selected && <span className="text-red-500 ml-2 font-normal">{errors.selected}</span>}
            </p>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-2">
              <Search size={12} className="text-slate-400 flex-shrink-0" />
              <input
                className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
                placeholder="ค้นหาชื่อ, รหัส..."
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {(accountType === 'employee' ? filteredEmployees : filteredDrivers).map(person => {
                const hasAccount = accountType === 'employee' ? usedEmpIds.has(person.id) : usedDrvIds.has(person.id)
                const isSelected = selectedId === person.id
                return (
                  <button
                    key={person.id}
                    disabled={hasAccount}
                    onClick={() => handleSelect(person.id, (person as any).username ?? person.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-sky-50' : hasAccount ? 'bg-slate-50 opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 ${
                      accountType === 'employee' ? 'bg-gradient-to-br from-violet-400 to-purple-500' : 'bg-gradient-to-br from-sky-400 to-blue-500'
                    }`}>
                      {person.first_name_th.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{person.first_name_th} {person.last_name_th}</p>
                      <p className="text-[10px] font-mono text-slate-400">{person.code}</p>
                    </div>
                    {hasAccount && <span className="text-[10px] text-slate-400">มี Account แล้ว</span>}
                    {isSelected && <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0" />}
                  </button>
                )
              })}
              {(accountType === 'employee' ? filteredEmployees : filteredDrivers).length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">ไม่พบข้อมูล</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: กำหนด Role ──────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">
            {accountType !== 'standalone' ? '3.' : '2.'} Role & ข้อมูล Account
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(isDriverRole
              ? [{ value: 'driver' as UserRole, label: 'Driver', desc: 'เข้าใช้งาน App คนขับ', color: 'bg-sky-100 text-sky-700 border-sky-200' }]
              : isCAdmin ? COMPANY_ADMIN_ROLES
              : ALL_EMPLOYEE_ROLES
            ).map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  role === r.value
                    ? `${r.color} ring-2 ring-offset-1 ring-sky-400`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className="text-xs font-bold">{r.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Field label="Username" required error={errors.username}>
              <Input
                placeholder="firstname.role"
                value={username}
                onChange={e => setUsername(e.target.value)}
                error={!!errors.username}
              />
            </Field>

            {!isSuperAdmin && !isDriverRole && !isCAdmin && (
              <Field label="บริษัท" required error={errors.company}>
                <Select value={companyId} onChange={e => setCompanyId(e.target.value)}>
                  <option value="">— เลือกบริษัท —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name_th} ({c.code})</option>)}
                </Select>
              </Field>
            )}

            <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              Password เริ่มต้น: <span className="font-mono font-bold text-slate-600">123456789</span>
              {isDriverRole && ' · อีเมลและเบอร์โทรดึงจากข้อมูลคนขับโดยอัตโนมัติ'}
            </p>
          </div>
        </div>

        {/* ── Preview ─────────────────────────────────────────── */}
        {(selected || accountType === 'standalone') && username && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs">
            <p className="font-bold text-emerald-700 mb-1.5">สรุปที่จะสร้าง</p>
            <div className="space-y-0.5 text-slate-600">
              {selected && <p>บุคคล: <span className="font-semibold">{(selected as any).first_name_th} {(selected as any).last_name_th}</span></p>}
              <p>Username: <span className="font-semibold font-mono">{username}</span></p>
              <p>Role: <span className="font-semibold">{getRoleLabel(role)}</span></p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={closeModal} className="flex-1">ยกเลิก</Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="flex-1">สร้าง Account</Button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// EDIT USER ACCOUNT
// ═══════════════════════════════════════════════════════════════
export function EditUserAccountModal() {
  const { modal, closeModal, addToast } = useStore()
  const { loadUserAccounts } = useAccountStore()
  const open = modal.type === 'edit-user-account'
  const ua: UserAccount | undefined = modal.data

  const [role, setRole]               = useState<UserRole>('employee')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPwd, setConfirmPwd]   = useState('')
  const [pwdError, setPwdError]       = useState('')
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    if (open && ua) { setRole(ua.role); setNewPassword(''); setConfirmPwd(''); setPwdError('') }
  }, [open, ua?.id])

  if (!ua || !open) return null

  const isDriver = ua.account_type === 'driver'
  const displayName = ua.employee
    ? `${ua.employee.first_name_th} ${ua.employee.last_name_th}`
    : ua.driver
      ? `${ua.driver.first_name_th} ${ua.driver.last_name_th}`
      : 'Standalone Admin'

  const handleSave = async () => {
    if (newPassword) {
      if (newPassword.length < 6) { setPwdError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
      if (newPassword !== confirmPwd) { setPwdError('รหัสผ่านไม่ตรงกัน'); return }
    }
    setPwdError('')
    setLoading(true)
    try {
      const headers = { 'Content-Type': 'application/json', ...authHeader() }
      const roleRes = await apiFetch(`/api/users/${ua.id}/set-role`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ role }),
      })
      const roleJson = await roleRes.json()
      if (!roleJson.success) throw new Error(roleJson.error ?? 'อัปเดต role ไม่สำเร็จ')

      if (newPassword) {
        const pwdRes = await apiFetch(`/api/users/${ua.id}/reset-password`, { method: 'PATCH', headers, body: JSON.stringify({ newPassword }) })
        const pwdJson = await pwdRes.json()
        if (!pwdJson.success) throw new Error(pwdJson.error ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
      }

      addToast('success', newPassword ? 'อัปเดต role และรหัสผ่านสำเร็จ' : 'อัปเดต role สำเร็จ')
      await loadUserAccounts()
      closeModal()
    } catch (e: any) {
      addToast('error', e.message ?? 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const roles = isDriver
    ? [{ value: 'driver' as UserRole, label: 'Driver', desc: 'App คนขับ', color: 'bg-sky-100 text-sky-700 border-sky-200' }]
    : COMPANY_ADMIN_ROLES

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไข Account" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{displayName}</p>
            <p className="text-[10px] text-slate-400 font-mono">{ua.username}</p>
          </div>
          <Badge variant={getRoleBadgeVariant(ua.role)} className="ml-auto">{getRoleLabel(ua.role)}</Badge>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Role</p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)}
                className={`rounded-xl border p-2.5 text-left transition-all ${role === r.value ? `${r.color} ring-2 ring-offset-1 ring-sky-400` : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <p className="text-xs font-bold">{r.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600">เปลี่ยนรหัสผ่าน <span className="text-slate-400 font-normal">(เว้นว่างถ้าไม่เปลี่ยน)</span></p>
          <Field label="รหัสผ่านใหม่">
            <Input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </Field>
          <Field label="ยืนยันรหัสผ่าน">
            <Input type="password" placeholder="พิมพ์อีกครั้ง" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
          </Field>
          {pwdError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwdError}</p>}
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// VIEW USER ACCOUNT
// ═══════════════════════════════════════════════════════════════
export function ViewUserAccountModal() {
  const { modal, closeModal, openModal } = useStore()
  const open = modal.type === 'view-user-account'
  const ua: UserAccount | undefined = modal.data
  if (!ua || !open) return null

  const displayName = ua.employee
    ? `${ua.employee.first_name_th} ${ua.employee.last_name_th}`
    : ua.driver
      ? `${ua.driver.first_name_th} ${ua.driver.last_name_th}`
      : 'Standalone Admin'

  return (
    <Modal open={open} onClose={closeModal} title="ข้อมูล User Account" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ปิด</Button>
        <Button variant="primary" size="sm" onClick={() => openModal('edit-user-account', ua)}>แก้ไข</Button>
      </>}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-400 capitalize">{ua.account_type} account</p>
            <div className="flex gap-1.5 mt-1">
              <Badge variant={getRoleBadgeVariant(ua.role)}>{getRoleLabel(ua.role)}</Badge>
              <Badge variant={ua.is_status === 'active' ? 'success' : 'gray'}>{ua.is_status === 'active' ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { icon: <Key size={11} />,       label: 'Username', value: ua.username },
            { icon: <Shield size={11} />,    label: 'Role',     value: getRoleLabel(ua.role) },
            { icon: <Mail size={11} />,      label: 'อีเมล',   value: ua.email ?? '-' },
            { icon: <Phone size={11} />,     label: 'โทร',     value: ua.tel ?? '-' },
            { icon: <Building2 size={11} />, label: 'บริษัท',  value: ua.company?.name_th ?? 'ทุกบริษัท' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-100">
              <span className="text-slate-400 mt-0.5">{item.icon}</span>
              <div><p className="text-[10px] text-slate-400">{item.label}</p><p className="font-semibold text-slate-700">{item.value}</p></div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// DELETE USER ACCOUNT
// ═══════════════════════════════════════════════════════════════
export function ChangePasswordModal() {
  const { modal, closeModal } = useStore()
  const { resetUserPassword } = useAccountStore()
  const open = modal.type === 'change-password'
  const ua: UserAccount | undefined = modal.data

  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirm]     = useState('')
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

  useEffect(() => {
    if (open) { setNewPassword(''); setConfirm(''); setError('') }
  }, [open])

  if (!ua || !open) return null

  const handleSubmit = async () => {
    if (newPassword.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (newPassword !== confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return }
    setError('')
    setLoading(true)
    try {
      await resetUserPassword(ua.id, newPassword)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={closeModal} title="เปลี่ยนรหัสผ่าน" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}
        </Button>
      </>}
    >
      <div className="space-y-4 py-1">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <Key size={14} className="text-slate-400" />
          <div>
            <p className="text-xs font-bold text-slate-700 font-mono">{ua.username}</p>
            <p className="text-[10px] text-slate-400">{getRoleLabel(ua.role)}</p>
          </div>
        </div>
        <Field label="รหัสผ่านใหม่">
          <Input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </Field>
        <Field label="ยืนยันรหัสผ่าน">
          <Input type="password" placeholder="พิมพ์รหัสผ่านอีกครั้ง" value={confirmPassword} onChange={e => setConfirm(e.target.value)} />
        </Field>
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>
    </Modal>
  )
}

export function DeleteUserAccountModal() {
  const { modal, closeModal } = useStore()
  const { deleteUserAccount } = useAccountStore()
  const open = modal.type === 'delete-user-account'
  const ua: UserAccount | undefined = modal.data
  if (!ua || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ปิดใช้งาน Account" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteUserAccount(ua.id)}>ยืนยัน</Button>
      </>}
    >
      <div className="text-center py-3 space-y-2">
        <p className="font-bold text-slate-800 font-mono">{ua.username}</p>
        <Badge variant={getRoleBadgeVariant(ua.role)}>{getRoleLabel(ua.role)}</Badge>
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mt-3">
          Account จะถูกปิดใช้งาน — ผู้ใช้จะเข้าสู่ระบบไม่ได้
        </p>
      </div>
    </Modal>
  )
}
