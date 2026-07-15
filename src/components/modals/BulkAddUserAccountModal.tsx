'use client'
import { useState, useMemo } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useCompanyStore } from '@/lib/stores/company.store'
import {
  Search, CheckSquare, Square, MinusSquare,
  User2, UserCheck, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, Shield, Key,
} from 'lucide-react'
import { getRoleLabel, getRoleBadgeVariant } from '@/components/modals/UserAccountModals'
import { isCompanyAdmin } from '@/lib/auth-token'
import type { UserRole, UserAccountType } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useRoleStore } from '@/lib/stores/roles.store'
import { useAccountStore } from '@/lib/stores/useAccoutStore';

type Step = 1 | 2 | 3
type Pattern = 'code' | 'firstname' | 'custom_prefix'

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',    label: 'Admin'    },
  { value: 'operator', label: 'Operator' },
  { value: 'viewer',   label: 'Viewer'   },
  { value: 'driver',   label: 'Driver'   },
  { value: 'employee', label: 'Employee' },
]

const COMPANY_ADMIN_ROLES: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Employee'    },
  { value: 'admin',    label: 'Admin แผนก' },
]

function StepBar({ step }: { step: Step }) {
  const steps = ['เลือกบุคคล', 'ตั้งค่า Account', 'ยืนยัน']
  return (
    <div className="flex items-center gap-0 mb-5">
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const done = step > n
        const active = step === n
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${active ? 'text-sky-700' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                active ? 'bg-sky-500 border-sky-500 text-white'
                : done  ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 text-slate-400'
              }`}>{done ? '✓' : n}</div>
              {label}
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export function BulkAddUserAccountModal() {
  const { modal, closeModal } = useStore()
  const{loadRoles} = useRoleStore()
  const {drivers,loadDrivers} = useDriverStore()
  const {employees,loadEmployees} = useEmployeeStore()
  const { userAccounts, bulkAddUserAccounts, loadUserAccounts } = useAccountStore()
  const{companies,loadCompanies} = useCompanyStore()
  const open = modal.type === 'bulk-add-user-account'
  const isCAdmin = isCompanyAdmin()

  // Step state
  const [step, setStep] = useState<Step>(1)
  const [accountType, setAccountType] = useState<'employee' | 'driver'>('employee')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Step 2
  const [role, setRole] = useState<UserRole>('employee')
  const [companyId, setCompanyId] = useState('')
  const [pattern, setPattern] = useState<Pattern>('firstname')
  const [customPrefix, setCustomPrefix] = useState('')
  const [emailDomain, setEmailDomain] = useState('')

  // Reset on open + load data
  useMemo(() => {
    if (open) {
      setStep(1); setAccountType('employee'); setSearch('')
      setSelected(new Set()); setRole('employee'); setCompanyId('')
      setPattern('firstname'); setCustomPrefix(''); setEmailDomain('')
      loadEmployees()
      loadCompanies()
      loadDrivers()
      loadUserAccounts()
      loadRoles()
    }
  }, [open])

  // Already-accounted IDs
  const usedEmpIds = useMemo(() => new Set(userAccounts.map(u => u.employee_id).filter(Boolean)), [userAccounts])
  const usedDrvIds = useMemo(() => new Set(userAccounts.map(u => u.driver_id).filter(Boolean)), [userAccounts])

  const pool = useMemo(() => {
    if (accountType === 'employee') {
      return employees.filter(e => {
        const q = `${e.first_name_th} ${e.last_name_th} ${e.code}`.toLowerCase()
        return q.includes(search.toLowerCase())
      }).map(e => ({
        id: e.id,
        code: e.code,
        name_th: `${e.first_name_th} ${e.last_name_th}`,
        first_name_en: e.first_name_en,
        last_name_en: e.last_name_en,
        username: e.username,
        hasAccount: usedEmpIds.has(e.id),
        isInactive: e.is_status !== 'active',
      }))
    }
    return drivers.filter(d => {
      const q = `${d.first_name_th} ${d.last_name_th} ${d.code}`.toLowerCase()
      return q.includes(search.toLowerCase())
    }).map(d => ({
      id: d.id,
      code: d.code,
      name_th: `${d.first_name_th} ${d.last_name_th}`,
      first_name_en: d.first_name_en,
      last_name_en: d.last_name_en,
      username: d.code,
      hasAccount: usedDrvIds.has(d.id),
      isInactive: false,
    }))
  }, [accountType, employees, drivers, search, usedEmpIds, usedDrvIds])

  const available = pool.filter(p => !p.hasAccount && !p.isInactive)
  const allSelected = available.length > 0 && available.every(p => selected.has(p.id))
  const someSelected = available.some(p => selected.has(p.id)) && !allSelected

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); available.forEach(p => n.delete(p.id)); return n })
    } else {
      setSelected(prev => new Set([...prev, ...available.map(p => p.id)]))
    }
  }

  // Preview usernames
  const selectedPool = pool.filter(p => selected.has(p.id))
  const previewUsername = (p: typeof pool[0]) => {
    if (pattern === 'code')          return p.code.toLowerCase()
    if (pattern === 'firstname')     return `${p.first_name_en.toLowerCase()}.${p.last_name_en.toLowerCase().charAt(0)}`
    return `${customPrefix || 'user'}.${p.code.toLowerCase()}`
  }

  const alreadyCounted = selectedPool.filter(p => p.hasAccount).length
  const willCreate     = selectedPool.length - alreadyCounted

  const handleConfirm = async () => {
    await bulkAddUserAccounts({
      account_type: accountType,
      ids: [...selected],
      role,
      company_id: companyId || null,
      username_pattern: pattern,
      custom_prefix: customPrefix || undefined,
      email_domain: emailDomain || undefined,
    })
  }

  return (
    <Modal open={open} onClose={closeModal} title="สร้าง Account หลายบัญชีพร้อมกัน" size="xl">
      <StepBar step={step} />

      {/* ══ Step 1: เลือกบุคคล ══════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4">

          {/* Type toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5 w-fit">
            {([
              { type: 'employee' as const, label: 'พนักงาน',  icon: <User2 size={12} /> },
              { type: 'driver'   as const, label: 'คนขับรถ',  icon: <UserCheck size={12} /> },
            ]).map(opt => (
              <button
                key={opt.type}
                onClick={() => { setAccountType(opt.type); setSelected(new Set()) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  accountType === opt.type ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
              placeholder="ค้นหาชื่อ, รหัส..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200">
              <button onClick={toggleAll} className="text-slate-400 hover:text-sky-600 transition-colors">
                {allSelected ? <CheckSquare size={14} className="text-sky-600" />
                  : someSelected ? <MinusSquare size={14} className="text-sky-500" />
                  : <Square size={14} />}
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                เลือกทั้งหมด ({available.length} คนที่สร้าง Account ได้)
              </span>
              <span className="ml-auto text-[10px] text-sky-600 font-bold">
                เลือกแล้ว {[...selected].filter(id => available.some(p => p.id === id)).length} คน
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {pool.map(p => {
                const isSelected = selected.has(p.id)
                const disabled = p.hasAccount || p.isInactive
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      disabled ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : isSelected ? 'bg-sky-50 cursor-pointer'
                      : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                    onClick={() => !disabled && toggleRow(p.id)}
                  >
                    <div className="text-slate-300">
                      {p.hasAccount ? <CheckCircle2 size={14} className="text-emerald-400" />
                        : p.isInactive ? <Square size={14} className="text-slate-300" />
                        : isSelected ? <CheckSquare size={14} className="text-sky-600" />
                        : <Square size={14} />}
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 ${
                      accountType === 'employee' ? 'bg-gradient-to-br from-violet-400 to-purple-500' : 'bg-gradient-to-br from-sky-400 to-blue-500'
                    }`}>
                      {p.name_th.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{p.name_th}</p>
                      <p className="text-[10px] font-mono text-slate-400">{p.code}</p>
                    </div>
                    {p.hasAccount && <span className="text-[10px] text-slate-400 flex-shrink-0">มี Account แล้ว</span>}
                    {p.isInactive && !p.hasAccount && <span className="text-[10px] text-red-400 flex-shrink-0">ไม่ใช้งาน</span>}
                  </div>
                )
              })}
              {pool.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-400">ไม่พบข้อมูล</p>
              )}
            </div>
          </div>

          {/* Selected chips */}
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pool.filter(p => selected.has(p.id)).slice(0, 6).map(p => (
                <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium border border-sky-200">
                  {p.name_th}
                </span>
              ))}
              {selected.size > 6 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">+{selected.size - 6}</span>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary" size="sm"
              onClick={() => setStep(2)}
              disabled={selected.size === 0}
            >
              ถัดไป ({selected.size} คน) <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}

      {/* ══ Step 2: ตั้งค่า Account ══════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4">

          {/* Role */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">Role สำหรับทุก Account ที่จะสร้าง</p>
            <div className="grid grid-cols-3 gap-2">
              {(accountType === 'driver'
                ? ALL_ROLES.filter(r => r.value === 'driver')
                : isCAdmin
                  ? COMPANY_ADMIN_ROLES
                  : ALL_ROLES.filter(r => r.value !== 'driver')
              ).map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`rounded-xl border p-2.5 text-xs font-semibold text-left transition-all ${
                    role === r.value
                      ? 'border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-400 ring-offset-1'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Badge variant={getRoleBadgeVariant(r.value)} className="mb-1">{getRoleLabel(r.value)}</Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Company (non-driver, non-company_admin) */}
          {accountType !== 'driver' && role !== 'super_admin' && !isCAdmin && (
            <Field label="บริษัทที่ดูแล">
              <Select value={companyId} onChange={e => setCompanyId(e.target.value)}>
                <option value="">— ไม่ระบุ —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name_th} ({c.code})</option>)}
              </Select>
            </Field>
          )}

          {/* Username pattern */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">รูปแบบ Username</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([
                { v: 'firstname'     as Pattern, label: 'ชื่อ.นามสกุล',  ex: 'somchai.j'       },
                { v: 'code'          as Pattern, label: 'รหัสพนักงาน',    ex: '930920'           },
                { v: 'custom_prefix' as Pattern, label: 'Prefix กำหนดเอง', ex: 'prefix.code'     },
              ]).map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setPattern(opt.v)}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    pattern === opt.v
                      ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-400 ring-offset-1'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-700">{opt.label}</p>
                  <p className="text-[10px] font-mono text-slate-400">{opt.ex}</p>
                </button>
              ))}
            </div>
            {pattern === 'custom_prefix' && (
              <Field label="Prefix">
                <Input
                  placeholder="เช่น user, emp, staff"
                  value={customPrefix}
                  onChange={e => setCustomPrefix(e.target.value)}
                />
              </Field>
            )}
          </div>

          {/* Email domain (employee only) */}
          {accountType === 'employee' && (
            <Field label="Email Domain (ไม่บังคับ)">
              <Input
                placeholder="เช่น @tttp.co.th → จะสร้างอีเมลอัตโนมัติ"
                value={emailDomain}
                onChange={e => setEmailDomain(e.target.value)}
              />
            </Field>
          )}

          <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            Password เริ่มต้น: <span className="font-mono font-bold text-slate-600">123456789</span>
            {accountType === 'driver' && ' · อีเมลและเบอร์โทรดึงจากข้อมูลคนขับโดยอัตโนมัติ'}
          </p>

          {/* Mini preview */}
          {selectedPool.slice(0, 3).length > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">ตัวอย่าง Username</p>
              {selectedPool.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{p.name_th}</span>
                  <span className="font-mono font-bold text-sky-700">{previewUsername(p)}</span>
                </div>
              ))}
              {selectedPool.length > 3 && (
                <p className="text-[10px] text-slate-400">... และอีก {selectedPool.length - 3} คน</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-between pt-1">
            <Button variant="secondary" size="sm" onClick={() => setStep(1)} icon={<ChevronLeft size={13} />}>ย้อนกลับ</Button>
            <Button variant="primary"   size="sm" onClick={() => setStep(3)}>ดูสรุป <ChevronRight size={13} /></Button>
          </div>
        </div>
      )}

      {/* ══ Step 3: ยืนยัน ══════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-4">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 text-center">
              <p className="text-[10px] text-sky-500 font-bold uppercase">เลือกทั้งหมด</p>
              <p className="text-2xl font-bold text-sky-700">{selected.size}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">จะสร้างได้</p>
              <p className="text-2xl font-bold text-emerald-700">{willCreate}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
              <p className="text-[10px] text-amber-500 font-bold uppercase">ข้าม (มีแล้ว)</p>
              <p className="text-2xl font-bold text-amber-700">{alreadyCounted}</p>
            </div>
          </div>

          {/* Settings summary */}
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs overflow-hidden">
            {[
              { label: 'ประเภท',    value: accountType === 'employee' ? 'พนักงาน' : 'คนขับรถ' },
              { label: 'Role',      value: getRoleLabel(role), badge: <Badge variant={getRoleBadgeVariant(role)}>{getRoleLabel(role)}</Badge> },
              ...(!isCAdmin ? [{ label: 'บริษัท', value: companyId ? companies.find(c => c.id === companyId)?.name_th ?? '-' : 'ไม่ระบุ' }] : []),
              { label: 'Username',  value: pattern === 'code' ? 'รหัสพนักงาน' : pattern === 'firstname' ? 'ชื่อ.นามสกุล' : `Prefix: ${customPrefix}` },
              ...(accountType === 'employee' ? [{ label: 'Email', value: emailDomain ? `อัตโนมัติ (${emailDomain})` : 'ไม่ระบุ' }] : []),
              { label: 'Password', value: '123456789 (default)' },
            ].map(row => (
              <div key={row.label} className="flex items-center px-3 py-2 gap-3">
                <span className="text-slate-400 w-20 flex-shrink-0">{row.label}</span>
                {row.badge ?? <span className="font-semibold text-slate-700">{row.value}</span>}
              </div>
            ))}
          </div>

          {/* Account list preview */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Key size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Account ที่จะสร้าง ({willCreate})</span>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {selectedPool.map(p => (
                <div key={p.id} className={`flex items-center gap-3 px-3 py-2 ${p.hasAccount ? 'opacity-40' : ''}`}>
                  {p.hasAccount
                    ? <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                    : <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                  }
                  <span className="text-xs text-slate-700 flex-1">{p.name_th}</span>
                  {p.hasAccount
                    ? <span className="text-[10px] text-amber-500">มีแล้ว — ข้าม</span>
                    : <span className="font-mono text-xs font-bold text-sky-700">{previewUsername(p)}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-between pt-1">
            <Button variant="secondary" size="sm" onClick={() => setStep(2)} icon={<ChevronLeft size={13} />}>ย้อนกลับ</Button>
            <Button
              variant="primary" size="sm"
              onClick={handleConfirm}
              disabled={willCreate === 0}
              icon={<Shield size={13} />}
            >
              สร้าง {willCreate} Account
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
