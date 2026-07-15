'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-fetch'
import { getProfile, setProfile, getAccessToken, StoredProfile } from '@/lib/auth-token'

function decodeJwtRole(token: string): string[] {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(payload))
    return Array.isArray(decoded?.role) ? decoded.role : []
  } catch { return [] }
}
import { useLang } from '@/lib/lang-context'
import { cn } from '@/lib/utils'
import {
  Shield, Layers, Plus, Pencil, Trash2, X, Check,
  ChevronRight, AlertCircle, Loader2, Search, ToggleLeft,
  ToggleRight, Save, Users, Package, UserCheck, ChevronDown,
  Building2, MapPin,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Role {
  id: string
  nameTh: string
  nameEn: string
  roleType: string
  status: string
}

interface SysModule {
  id: string
  code: string
  nameTh: string
  nameEn: string
  domain: string
  status: string
}

interface UserWithRoles {
  employeeId: string
  code: string
  firstNameTh: string | null
  lastNameTh:  string | null
  firstNameEn: string | null
  lastNameEn:  string | null
  email:       string | null
  userId:      string | null
  username:    string | null
  userStatus:  string | null
  roles: { id: string; type: string; nameTh: string; nameEn: string }[]
}

interface CompanyOption { id: string; nameTh: string; nameEn: string }
interface PlantOption   { id: string; plantId: string; nameTh: string; nameEn: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
  superadmin: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
  admin: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  employee: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  driver: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
}

function getRoleStyle(type: string) {
  return ROLE_STYLE[type?.toLowerCase()] ?? ROLE_STYLE['employee']
}

// Map each domain → sidebar group key (same structure as Sidebar navGroups)
const DOMAIN_TO_GROUP: Record<string, string> = {
  '/dashboard':                    'overview',
  '/dashboard/operations':         'operations',
  '/dashboard/consolidation':      'operations',
  '/dashboard/bookings':           'operations',
  '/dashboard/reserves':           'operations',
  '/dashboard/attendances':        'operations',
  '/dashboard/tracking':           'operations',
  '/dashboard/hazard':             'operations',
  '/dashboard/users':              'people',
  '/dashboard/employees':          'people',
  '/dashboard/drivers':            'people',
  '/dashboard/fleet':              'fleet',
  '/dashboard/vehicles':           'fleet',
  '/dashboard/vehicle-types':      'fleet',
  '/dashboard/vendors':            'fleet',
  '/dashboard/zones':              'routes',
  '/dashboard/routes':             'routes',
  '/dashboard/shifts':             'routes',
  '/dashboard/posts':              'routes',
  '/dashboard/schedule':           'routes',
  '/dashboard/calendar':           'routes',
  '/dashboard/companies':          'org',
  '/dashboard/plants':             'org',
  '/dashboard/coordinators':       'org',
  '/dashboard/organization':       'org',
  '/dashboard/booking-policies':   'org',
  '/dashboard/reports/usage':      'reports',
  '/dashboard/reports/attendance': 'reports',
  '/dashboard/reports/vehicles':   'reports',
  '/dashboard/reports/auth':       'reports',
  '/dashboard/permissions':        'system',
  '/dashboard/feedback':           'system',
  '/dashboard/notifications':      'system',
  '/dashboard/settings':           'system',
}

const GROUP_LABEL: Record<string, string> = {
  overview:    'ภาพรวม',
  operations:  'การดำเนินงาน',
  people:      'จัดการบุคคล',
  fleet:       'จัดการพาหนะ',
  routes:      'เส้นทาง & กะ',
  org:         'องค์กร & นโยบาย',
  reports:     'รายงาน',
  system:      'ระบบ',
  other:       'อื่นๆ',
}

const GROUP_ORDER = ['overview', 'operations', 'people', 'fleet', 'routes', 'org', 'reports', 'system', 'other']

function groupModules(modules: SysModule[]): Record<string, SysModule[]> {
  const groups: Record<string, SysModule[]> = {}
  for (const m of modules) {
    const group = DOMAIN_TO_GROUP[m.domain ?? ''] ?? 'other'
    if (!groups[group]) groups[group] = []
    groups[group].push(m)
  }
  return groups
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border',
      type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700',
    )}>
      {type === 'success' ? <Check size={15}/> : <AlertCircle size={15}/>}
      {msg}
    </div>
  )
}

// ── Role Form Modal ────────────────────────────────────────────────────────────

interface RoleFormModalProps {
  role: Partial<Role> | null
  onClose: () => void
  onSaved: () => void
}

const ROLE_TYPES = [
  { value: 'admin',    labelTh: 'ผู้ดูแลระบบ',    labelEn: 'Admin' },
  { value: 'employee', labelTh: 'พนักงาน',          labelEn: 'Employee' },
  { value: 'driver',   labelTh: 'คนขับ',           labelEn: 'Driver' },
]

function RoleFormModal({ role, onClose, onSaved }: RoleFormModalProps) {
  const { lang } = useLang()
  const isEdit = !!role?.id
  const [nameTh, setNameTh]   = useState(role?.nameTh ?? '')
  const [nameEn, setNameEn]   = useState(role?.nameEn ?? '')
  const [roleType, setRoleType] = useState(role?.roleType ?? 'employee')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameTh.trim() || !nameEn.trim()) { setError('กรุณากรอกชื่อบทบาททั้งภาษาไทยและอังกฤษ'); return }
    setSaving(true); setError('')
    try {
      const url    = isEdit ? `/api/roles/${role!.id}` : '/api/roles'
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameTh, nameEn, roleType, status: 'active' }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json?.error?.th ?? json?.error?.en ?? 'เกิดข้อผิดพลาด'); return }
      onSaved()
    } catch { setError('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-slate-500"/>
            <h3 className="text-sm font-bold text-slate-800">
              {isEdit ? 'แก้ไขบทบาท' : 'เพิ่มบทบาทใหม่'}
            </h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={14}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ชื่อบทบาท (ไทย)</label>
            <input
              value={nameTh}
              onChange={e => setNameTh(e.target.value)}
              placeholder="เช่น ผู้จัดการโซน"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ชื่อบทบาท (EN)</label>
            <input
              value={nameEn}
              onChange={e => setNameEn(e.target.value)}
              placeholder="e.g. Zone Manager"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ประเภทบทบาท</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_TYPES.map(rt => {
                const s = getRoleStyle(rt.value)
                return (
                  <button key={rt.value} type="button"
                    onClick={() => setRoleType(rt.value)}
                    className={cn(
                      'px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                      roleType === rt.value
                        ? cn(s.bg, s.border, 'ring-2 ring-offset-1 ring-sky-300')
                        : 'border-slate-200 text-slate-500 hover:border-slate-300',
                    )}>
                    {lang === 'th' ? rt.labelTh : rt.labelEn}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle size={12}/>{error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              ยกเลิก
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
              {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มบทบาท'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

function DeleteConfirmModal({ role, onClose, onDeleted }: { role: Role; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/roles/${role.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted()
    } finally { setDeleting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-red-500"/>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">ลบบทบาท</p>
            <p className="text-xs text-slate-400">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          ยืนยันการลบบทบาท <span className="font-bold text-slate-800">&quot;{role.nameTh}&quot;</span> ?
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            ยกเลิก
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
            ลบบทบาท
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Role Multi-Select Dropdown ─────────────────────────────────────────────────

function RoleMultiSelect({
  availableRoles,
  selectedIds,
  onChange,
  lang,
}: {
  availableRoles: Role[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  lang: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = availableRoles.filter(r => selectedIds.includes(r.id))

  function toggle(roleId: string) {
    if (selectedIds.includes(roleId)) {
      onChange(selectedIds.filter(id => id !== roleId))
    } else {
      onChange([...selectedIds, roleId])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors min-w-[120px] max-w-[220px]',
          open ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300',
        )}>
        <span className="flex-1 text-left truncate">
          {selected.length === 0
            ? <span className="text-slate-400 italic">ยังไม่มีบทบาท</span>
            : selected.map(r => (
                <span key={r.id} className={cn('inline-flex items-center mr-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold', getRoleStyle(r.roleType).badge)}>
                  {lang === 'th' ? r.nameTh : r.nameEn}
                </span>
              ))
          }
        </span>
        <ChevronDown size={11} className={cn('flex-shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}/>
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[180px]">
          {availableRoles.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400">ไม่มีบทบาทที่เลือกได้</p>
          )}
          {availableRoles.map(r => {
            const checked = selectedIds.includes(r.id)
            const s = getRoleStyle(r.roleType)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors',
                  checked && 'bg-sky-50',
                )}>
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                  checked ? 'bg-sky-500 border-sky-500' : 'border-slate-300',
                )}>
                  {checked && <Check size={9} className="text-white"/>}
                </div>
                <span className={cn('font-semibold', checked ? 'text-slate-700' : 'text-slate-500')}>
                  {lang === 'th' ? r.nameTh : r.nameEn}
                </span>
                <span className={cn('ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full border', s.badge)}>
                  {r.roleType}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const router = useRouter()
  const { lang } = useLang()
  const [accessChecked, setAccessChecked] = useState(false)

  // ── scope helpers (read once after access is confirmed)
  const profile        = typeof window !== 'undefined' ? getProfile() : null
  const isSA           = profile?.roleTypes?.includes('superadmin')   ?? false
  const isCA           = profile?.roleTypes?.includes('company_admin') ?? false
  const myCompanyId    = profile?.companyId    ?? null
  const myPlantIds     = profile?.plantIds     ?? []   // companys_plants.id list

  // guard — fetch fresh profile if roleTypes missing, then fallback to JWT decode
  useEffect(() => {
    async function checkAccess() {
      let roleTypes: string[] = getProfile()?.roleTypes ?? []

      // Try fresh profile fetch if roleTypes not cached
      if (!roleTypes.length) {
        try {
          const res  = await apiFetch('/api/auth/profile')
          const json = await res.json().catch(() => ({}))
          if (json?.success && json?.data) {
            const fresh = json.data as StoredProfile
            setProfile(fresh)
            roleTypes = fresh.roleTypes ?? []
          }
        } catch { /* ignore */ }
      }

      // Last resort: decode JWT directly (works even if backend not restarted)
      if (!roleTypes.length) {
        const token = getAccessToken()
        if (token) roleTypes = decodeJwtRole(token)
      }

      if (!roleTypes.includes('superadmin')) {
        router.replace('/dashboard')
      } else {
        setAccessChecked(true)
      }
    }
    checkAccess()
  }, [router])

  const [tab, setTab] = useState<'modules' | 'roles' | 'users'>('modules')

  // ── shared data
  const [roles,       setRoles]      = useState<Role[]>([])
  const [modules,     setModules]    = useState<SysModule[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [initError,   setInitError]  = useState<string | null>(null)

  // ── module-permissions tab state
  const [selectedRole,    setSelectedRole]    = useState<Role | null>(null)
  const [assignedIds,     setAssignedIds]     = useState<Set<string>>(new Set())
  const [loadingModules,  setLoadingModules]  = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [moduleSearch,    setModuleSearch]    = useState('')

  // ── roles tab state
  const [roleSearch,   setRoleSearch]  = useState('')
  const [formRole,     setFormRole]    = useState<Partial<Role> | null | false>(false)
  const [deleteRole,   setDeleteRole]  = useState<Role | null>(null)

  // ── user-roles tab state
  const [companies,         setCompanies]         = useState<CompanyOption[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [plants,            setPlants]            = useState<PlantOption[]>([])
  const [selectedPlantId,   setSelectedPlantId]   = useState('')
  const [usersWithRoles,    setUsersWithRoles]    = useState<UserWithRoles[]>([])
  const [loadingUsers,      setLoadingUsers]      = useState(false)
  const [savingUserId,      setSavingUserId]      = useState<string | null>(null)
  const [dirtyRoles,        setDirtyRoles]        = useState<Map<string, string[]>>(new Map())
  const [userSearch,        setUserSearch]        = useState('')

  // toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
  }, [])

  // ── initial load
  async function loadInit() {
    setLoadingInit(true)
    setInitError(null)
    try {
      const [rolesRes, modsRes, companiesRes] = await Promise.all([
        apiFetch('/api/roles?limit=100&status=active'),
        apiFetch('/api/sys-modules'),
        apiFetch('/api/companies?company_type=customer&limit=200'),
      ])
      const rolesJson     = await rolesRes.json().catch(() => ({}))
      const modsJson      = await modsRes.json().catch(() => ({}))
      const companiesJson = await companiesRes.json().catch(() => ({}))

      if (!rolesRes.ok) {
        setInitError('โหลดข้อมูลบทบาทไม่สำเร็จ — กรุณา restart backend แล้วลองใหม่')
        return
      }
      if (!modsRes.ok) {
        setInitError('โหลดข้อมูลโมดูลไม่สำเร็จ — กรุณา restart backend เพื่อเปิดใช้งาน /sys-modules endpoint')
        return
      }

      const rolesData: Role[]  = rolesJson?.data?.data ?? rolesJson?.data ?? []
      const modsData: SysModule[] = modsJson?.data ?? []
      const companiesRaw: any[] = companiesJson?.data?.data ?? companiesJson?.data ?? []

      setRoles(rolesData)
      setModules(modsData)
      setCompanies(companiesRaw.map(c => ({
        id:     c.id,
        nameTh: c.name_th ?? c.nameTh ?? '',
        nameEn: c.name_en ?? c.nameEn ?? '',
      })))

      // Non-SA: auto-select own company
      if (!isSA && myCompanyId) setSelectedCompanyId(myCompanyId)

      if (rolesData.length > 0) setSelectedRole(rolesData[0])
    } finally {
      setLoadingInit(false)
    }
  }

  useEffect(() => { if (accessChecked) loadInit() }, [accessChecked])

  // ── load plants when company changes
  useEffect(() => {
    setPlants([])
    setSelectedPlantId('')
    setUsersWithRoles([])
    if (!selectedCompanyId) return
    apiFetch(`/api/companies/${selectedCompanyId}/plants`)
      .then(r => r.json())
      .then(json => {
        const raw: any[] = Array.isArray(json?.data) ? json.data : []
        const mapped: PlantOption[] = raw.map(cp => ({
          id:      cp.id ?? '',
          plantId: cp.plant_id ?? cp.plants?.id ?? '',
          nameTh:  cp.plants?.name_th ?? cp.nameTh ?? '',
          nameEn:  cp.plants?.name_en ?? cp.nameEn ?? '',
        }))
        // company_admin sees only plants from their organization_permissions
        const visible = isCA && myPlantIds.length > 0
          ? mapped.filter(p => myPlantIds.includes(p.id))
          : mapped
        setPlants(visible)
        // plant-scoped admin: auto-select their single plant
        if (!isSA && !isCA && visible.length > 0) {
          setSelectedPlantId(visible[0].plantId)
        }
      })
      .catch(() => {})
  }, [selectedCompanyId])

  // ── load users with roles when plant changes
  useEffect(() => {
    setUsersWithRoles([])
    setDirtyRoles(new Map())
    if (!selectedCompanyId || !selectedPlantId) return
    setLoadingUsers(true)
    apiFetch(`/api/companies/${selectedCompanyId}/plants/${selectedPlantId}/user-roles`)
      .then(r => r.json())
      .then(json => {
        const data: UserWithRoles[] = Array.isArray(json?.data) ? json.data : []
        setUsersWithRoles(data)
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [selectedCompanyId, selectedPlantId])

  // ── load modules for selected role
  async function loadRoleModules(role: Role) {
    setLoadingModules(true)
    setAssignedIds(new Set())
    try {
      const res  = await apiFetch(`/api/roles/${role.id}/modules`)
      const json = await res.json().catch(() => ({}))
      const ids: string[] = json?.data ?? []
      setAssignedIds(new Set(ids))
    } finally {
      setLoadingModules(false)
    }
  }

  useEffect(() => {
    if (selectedRole) loadRoleModules(selectedRole)
  }, [selectedRole])

  // ── save role modules
  async function handleSave() {
    if (!selectedRole) return
    setSaving(true)
    try {
      const res = await apiFetch(`/api/roles/${selectedRole.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds: [...assignedIds] }),
      })
      if (res.ok) {
        showToast('บันทึกสิทธิ์สำเร็จ', 'success')
      } else {
        const j = await res.json().catch(() => ({}))
        showToast(j?.error?.th ?? 'เกิดข้อผิดพลาด', 'error')
      }
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── save user roles
  async function handleSaveUserRoles(user: UserWithRoles) {
    if (!user.userId) { showToast('ผู้ใช้รายนี้ยังไม่มีบัญชี', 'error'); return }
    const roleIds = dirtyRoles.get(user.userId) ?? user.roles.map(r => r.id)
    setSavingUserId(user.userId)
    try {
      const res = await apiFetch(`/api/users/${user.userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds }),
      })
      if (res.ok) {
        setUsersWithRoles(prev => prev.map(u =>
          u.userId === user.userId
            ? { ...u, roles: roles.filter(r => roleIds.includes(r.id)).map(r => ({ id: r.id, type: r.roleType, nameTh: r.nameTh, nameEn: r.nameEn })) }
            : u
        ))
        setDirtyRoles(prev => { const m = new Map(prev); m.delete(user.userId!); return m })
        showToast('บันทึกบทบาทสำเร็จ', 'success')
      } else {
        const j = await res.json().catch(() => ({}))
        showToast(j?.error?.th ?? 'เกิดข้อผิดพลาด', 'error')
      }
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSavingUserId(null)
    }
  }

  function toggleModule(moduleId: string) {
    setAssignedIds(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  function toggleAll(ids: string[], checked: boolean) {
    setAssignedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => { if (checked) next.add(id); else next.delete(id) })
      return next
    })
  }

  // ── computed
  const roleStyle     = selectedRole ? getRoleStyle(selectedRole.roleType) : null
  const filteredMods  = modules.filter(m =>
    !moduleSearch ||
    m.nameTh.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.nameEn.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.code.toLowerCase().includes(moduleSearch.toLowerCase()),
  )
  const modGroups = groupModules(filteredMods)
  const filteredRoles = roles.filter(r =>
    !roleSearch ||
    r.nameTh.includes(roleSearch) ||
    r.nameEn.toLowerCase().includes(roleSearch.toLowerCase()),
  )
  const assignableRoles = roles.filter(r => r.roleType !== 'superadmin' && r.status === 'active')
  const filteredUsers = usersWithRoles.filter(u =>
    !userSearch ||
    u.code.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.firstNameTh ?? '').includes(userSearch) ||
    (u.lastNameTh ?? '').includes(userSearch) ||
    (u.firstNameEn ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.lastNameEn ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.username ?? '').toLowerCase().includes(userSearch.toLowerCase()),
  )

  if (!accessChecked || loadingInit) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-slate-300"/>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-10">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-bold text-red-700 mb-1">ไม่สามารถโหลดข้อมูลได้</p>
            <p className="text-sm text-red-600">{initError}</p>
            <button
              onClick={loadInit}
              className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    )
  }

  const TABS = [
    { key: 'modules', label: 'สิทธิ์โมดูล',   icon: <Layers size={13}/> },
    { key: 'roles',   label: 'จัดการบทบาท',  icon: <Users size={13}/> },
    { key: 'users',   label: 'สิทธิ์ผู้ใช้',   icon: <UserCheck size={13}/> },
  ] as const

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
          <span>Dashboard</span>
          <ChevronRight size={10}/>
          <span className="text-slate-600 font-semibold">จัดการสิทธิ์</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-violet-600"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">จัดการสิทธิ์การใช้งาน</h1>
            <p className="text-sm text-slate-400">กำหนดสิทธิ์การเข้าถึงโมดูลสำหรับแต่ละบทบาท</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {TABS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Module Permissions ─────────────────────────────── */}
      {tab === 'modules' && (
        <div className="flex gap-5 h-[calc(100vh-260px)] min-h-[500px]">

          {/* Left: Role selector */}
          <div className="w-60 flex-shrink-0 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">เลือกบทบาท</p>
            {roles.filter(r => r.status === 'active').map(role => {
              const s = getRoleStyle(role.roleType)
              const isSelected = selectedRole?.id === role.id
              return (
                <button key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left',
                    isSelected
                      ? cn(s.bg, s.border, 'shadow-sm')
                      : 'bg-white border-slate-200 hover:border-slate-300',
                  )}>
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isSelected ? s.dot : 'bg-slate-200')}/>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-xs font-bold leading-tight truncate', isSelected ? 'text-slate-800' : 'text-slate-600')}>
                      {lang === 'th' ? role.nameTh : role.nameEn}
                    </p>
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full border inline-block mt-0.5',
                      isSelected ? s.badge : 'bg-slate-50 text-slate-400 border-slate-200',
                    )}>
                      {role.roleType}
                    </span>
                  </div>
                  {isSelected && <ChevronRight size={12} className={cn('flex-shrink-0', isSelected ? 'text-slate-500' : 'text-slate-300')}/>}
                </button>
              )
            })}
          </div>

          {/* Right: Module toggles */}
          <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden">

            {/* Header */}
            <div className={cn(
              'flex items-center justify-between px-5 py-3.5 border-b border-slate-100',
              roleStyle ? roleStyle.bg : '',
            )}>
              <div className="flex items-center gap-2.5">
                <Package size={15} className="text-slate-500"/>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedRole ? (lang === 'th' ? selectedRole.nameTh : selectedRole.nameEn) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {assignedIds.size} จาก {modules.length} โมดูล
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input
                    value={moduleSearch}
                    onChange={e => setModuleSearch(e.target.value)}
                    placeholder="ค้นหาโมดูล..."
                    className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-sky-300 w-40"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedRole}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                  บันทึก
                </button>
              </div>
            </div>

            {/* Module list */}
            {loadingModules ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-slate-300"/>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.entries(modGroups).sort(([a], [b]) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)).map(([group, mods]) => {
                  const allChecked = mods.every(m => assignedIds.has(m.id))
                  const someChecked = mods.some(m => assignedIds.has(m.id))
                  return (
                    <div key={group}>
                      {/* Group header */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {GROUP_LABEL[group] ?? group}
                        </p>
                        <button
                          onClick={() => toggleAll(mods.map(m => m.id), !allChecked)}
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors',
                            allChecked
                              ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                              : someChecked
                                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                : 'text-slate-400 bg-slate-50 hover:bg-slate-100',
                          )}>
                          {allChecked ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                        </button>
                      </div>

                      {/* Module cards */}
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                        {mods.map(m => {
                          const on = assignedIds.has(m.id)
                          return (
                            <button key={m.id}
                              onClick={() => toggleModule(m.id)}
                              className={cn(
                                'flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all',
                                on
                                  ? 'bg-sky-50 border-sky-200 shadow-sm'
                                  : 'bg-white border-slate-200 hover:border-slate-300',
                              )}>
                              <div className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                                on ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400',
                              )}>
                                {m.code.slice(0, 2)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cn('text-xs font-semibold leading-tight truncate', on ? 'text-sky-800' : 'text-slate-600')}>
                                  {lang === 'th' ? m.nameTh : m.nameEn}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate font-mono">{m.code}</p>
                              </div>
                              {on
                                ? <ToggleRight size={16} className="text-sky-500 flex-shrink-0"/>
                                : <ToggleLeft  size={16} className="text-slate-300 flex-shrink-0"/>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {filteredMods.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                    <Package size={32}/>
                    <p className="text-sm mt-2">ไม่พบโมดูลที่ค้นหา</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: Role Management ────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input
                value={roleSearch}
                onChange={e => setRoleSearch(e.target.value)}
                placeholder="ค้นหาบทบาท..."
                className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-300 w-60"
              />
            </div>
            <button
              onClick={() => setFormRole({})}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition-colors">
              <Plus size={14}/> เพิ่มบทบาท
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ชื่อ (ไทย)', 'ชื่อ (EN)', 'ประเภท', 'สถานะ', ''].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRoles.map(role => {
                  const s = getRoleStyle(role.roleType)
                  return (
                    <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-700">{role.nameTh}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-500">{role.nameEn}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', s.badge)}>
                          {role.roleType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          role.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200',
                        )}>
                          {role.status === 'active' ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setFormRole(role)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors">
                            <Pencil size={13}/>
                          </button>
                          <button
                            onClick={() => setDeleteRole(role)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredRoles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <Shield size={32}/>
                <p className="text-sm mt-2">ไม่พบบทบาท</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: User Roles per Company/Plant ───────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Company — locked for non-SA */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                <Building2 size={9} className="inline mr-1"/>บริษัท (Customer)
              </label>
              {isSA ? (
                <select
                  value={selectedCompanyId}
                  onChange={e => setSelectedCompanyId(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 bg-white min-w-[200px]">
                  <option value="">— เลือกบริษัท —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {lang === 'th' ? c.nameTh : c.nameEn}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 bg-slate-50 min-w-[200px] flex items-center gap-1.5">
                  <Building2 size={12} className="text-slate-400"/>
                  {lang === 'th'
                    ? companies.find(c => c.id === myCompanyId)?.nameTh
                    : companies.find(c => c.id === myCompanyId)?.nameEn}
                </div>
              )}
            </div>

            {/* Plant — SA/CA can select; plant-scoped admin sees their plant only */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                <MapPin size={9} className="inline mr-1"/>โรงงาน / Plant
              </label>
              {(isSA || isCA) ? (
                <select
                  value={selectedPlantId}
                  onChange={e => setSelectedPlantId(e.target.value)}
                  disabled={!selectedCompanyId || plants.length === 0}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 bg-white min-w-[200px] disabled:opacity-50">
                  <option value="">— เลือกโรงงาน —</option>
                  {plants.map(p => (
                    <option key={p.plantId} value={p.plantId}>
                      {lang === 'th' ? p.nameTh : p.nameEn}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 bg-slate-50 min-w-[200px] flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-400"/>
                  {plants.length > 0
                    ? (lang === 'th' ? plants[0].nameTh : plants[0].nameEn)
                    : '—'}
                </div>
              )}
            </div>

            {/* Search */}
            {selectedPlantId && (
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="ค้นหาพนักงาน..."
                  className="pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-300 w-48"
                />
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {!selectedPlantId ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <UserCheck size={36}/>
                <p className="text-sm mt-2 text-slate-400">
                  {!selectedCompanyId ? 'เลือกบริษัทและโรงงานเพื่อดูรายการพนักงาน' : 'เลือกโรงงานเพื่อดูรายการพนักงาน'}
                </p>
              </div>
            ) : loadingUsers ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={22} className="animate-spin text-slate-300"/>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    {filteredUsers.length} รายการ
                    {dirtyRoles.size > 0 && (
                      <span className="ml-2 text-amber-600">· มีการเปลี่ยนแปลง {dirtyRoles.size} รายการ</span>
                    )}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['รหัส', 'ชื่อ-นามสกุล', 'บัญชีผู้ใช้', 'บทบาท', ''].map(h => (
                          <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map(u => {
                        const currentIds = dirtyRoles.has(u.userId ?? '')
                          ? dirtyRoles.get(u.userId!)!
                          : u.roles.map(r => r.id)
                        const isDirty = dirtyRoles.has(u.userId ?? '')
                        const isSaving = savingUserId === u.userId
                        const hasAccount = !!u.userId

                        return (
                          <tr key={u.employeeId} className={cn(
                            'hover:bg-slate-50/50 transition-colors',
                            isDirty && 'bg-amber-50/40',
                          )}>
                            {/* Code */}
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {u.code}
                              </span>
                            </td>

                            {/* Name */}
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-700">
                                {lang === 'th'
                                  ? `${u.firstNameTh ?? ''} ${u.lastNameTh ?? ''}`.trim() || '—'
                                  : `${u.firstNameEn ?? ''} ${u.lastNameEn ?? ''}`.trim() || '—'}
                              </p>
                              {u.email && <p className="text-[10px] text-slate-400">{u.email}</p>}
                            </td>

                            {/* Username */}
                            <td className="px-4 py-3">
                              {hasAccount ? (
                                <div>
                                  <p className="text-xs font-semibold text-slate-600">{u.username}</p>
                                  <span className={cn(
                                    'text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
                                    u.userStatus === 'active'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                      : 'bg-slate-50 text-slate-400 border-slate-200',
                                  )}>
                                    {u.userStatus === 'active' ? 'ใช้งาน' : 'ระงับ'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">ยังไม่มีบัญชี</span>
                              )}
                            </td>

                            {/* Roles */}
                            <td className="px-4 py-3">
                              {hasAccount ? (
                                <RoleMultiSelect
                                  availableRoles={assignableRoles}
                                  selectedIds={currentIds}
                                  onChange={ids => {
                                    if (!u.userId) return
                                    setDirtyRoles(prev => {
                                      const m = new Map(prev)
                                      m.set(u.userId!, ids)
                                      return m
                                    })
                                  }}
                                  lang={lang}
                                />
                              ) : (
                                <span className="text-[10px] text-slate-300 italic">—</span>
                              )}
                            </td>

                            {/* Save */}
                            <td className="px-4 py-3">
                              {hasAccount && (
                                <button
                                  onClick={() => handleSaveUserRoles(u)}
                                  disabled={isSaving || !isDirty}
                                  className={cn(
                                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all',
                                    isDirty
                                      ? 'bg-sky-500 hover:bg-sky-600 text-white'
                                      : 'bg-slate-100 text-slate-300 cursor-default',
                                  )}>
                                  {isSaving ? <Loader2 size={11} className="animate-spin"/> : <Save size={11}/>}
                                  บันทึก
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && !loadingUsers && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                      <Users size={32}/>
                      <p className="text-sm mt-2">
                        {usersWithRoles.length === 0 ? 'ไม่พบพนักงานในโรงงานนี้' : 'ไม่พบพนักงานที่ค้นหา'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────── */}
      {formRole !== false && (
        <RoleFormModal
          role={formRole}
          onClose={() => setFormRole(false)}
          onSaved={() => {
            setFormRole(false)
            loadInit()
            showToast(formRole?.id ? 'แก้ไขบทบาทสำเร็จ' : 'เพิ่มบทบาทสำเร็จ', 'success')
          }}
        />
      )}

      {deleteRole && (
        <DeleteConfirmModal
          role={deleteRole}
          onClose={() => setDeleteRole(null)}
          onDeleted={() => {
            setDeleteRole(null)
            loadInit()
            showToast('ลบบทบาทสำเร็จ', 'success')
          }}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  )
}
