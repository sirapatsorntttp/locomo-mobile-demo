'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  Users, Plus, Search, Eye, Pencil, Trash2, Download,
  UserCheck, Shield, User2, ToggleLeft, ToggleRight,
  Phone, Mail, Bus, Key, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'

import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { getRoleBadgeVariant, getRoleLabel } from '@/components/modals/UserAccountModals'
import { useLang } from '@/lib/lang-context'
import type { UserRole } from '@/types'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useAccountStore } from '@/lib/stores/useAccoutStore';
import { useCompanyStore } from '@/lib/stores/company.store'

type Tab = 'accounts' | 'employees' | 'drivers'

export default function UsersPage() {
  const { openModal } = useStore()
  const { employees, loadEmployees } = useEmployeeStore()
  const { drivers, driverVehicles, loadDrivers } = useDriverStore()
  const { userAccounts, loadUserAccounts, toggleUserAccountStatus } = useAccountStore()
    const { companies,loadCompanies  } = useCompanyStore()
  const { t } = useLang()

  useEffect(() => {
    loadUserAccounts()
    loadEmployees()
    loadDrivers()
    loadCompanies()
  }, [])

  const [tab, setTab] = useState<Tab>('employees')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [companyFilter, setCompany] = useState('')

  const enriched = useMemo(() => userAccounts.map(ua => ({
    ...ua,
    employee: ua.employee_id ? employees.find(e => e.id === ua.employee_id) : undefined,
    driver: ua.driver_id ? drivers.find(d => d.id === ua.driver_id) : undefined,
  })), [userAccounts, employees, drivers])

  const accountByEmpId = useMemo(() => {
    const m = new Map<string, typeof enriched[0]>()
    enriched.forEach(ua => { if (ua.employee_id) m.set(ua.employee_id, ua) })
    return m
  }, [enriched])

  const accountByDrvId = useMemo(() => {
    const m = new Map<string, typeof enriched[0]>()
    enriched.forEach(ua => { if (ua.driver_id) m.set(ua.driver_id, ua) })
    return m
  }, [enriched])

  const vehicleByDrvId = useMemo(() => {
    const m = new Map<string, string>()
    driverVehicles.forEach(dv => { if (dv.vehicle?.license) m.set(dv.driver_id, dv.vehicle.license) })
    return m
  }, [driverVehicles])

  const stats = {
    totalEmployees: employees.length,
    totalDrivers: drivers.length,
    totalAccounts: userAccounts.length,
    activeAccounts: userAccounts.filter(u => u.is_status === 'active').length,
    empWithAccount: employees.filter(e => accountByEmpId.has(e.id)).length,
    drvWithAccount: drivers.filter(d => accountByDrvId.has(d.id)).length,
    empNoAccount: employees.filter(e => !accountByEmpId.has(e.id)).length,
    drvNoAccount: drivers.filter(d => !accountByDrvId.has(d.id)).length,
  }

  const filteredEmployees = useMemo(() => employees.filter(e => {
    const q = `${e.first_name_th} ${e.last_name_th} ${e.code} ${e.username}`.toLowerCase()
    return q.includes(search.toLowerCase()) && (statusFilter === 'all' || e.is_status === statusFilter)
  }), [employees, search, statusFilter])

  const filteredDrivers = useMemo(() => drivers.filter(d => {
    const q = `${d.first_name_th} ${d.last_name_th} ${d.code}`.toLowerCase()
    return q.includes(search.toLowerCase()) && (statusFilter === 'all' || d.is_status === statusFilter)
  }), [drivers, search, statusFilter])

  const filteredAccounts = useMemo(() => enriched.filter(ua => {
    const emp = ua.employee; const drv = ua.driver
    const name = emp ? `${emp.first_name_th} ${emp.last_name_th} ${emp.code}` : drv ? `${drv.first_name_th} ${drv.last_name_th} ${drv.code}` : ''
    const q = `${ua.username} ${name}`.toLowerCase()
    return q.includes(search.toLowerCase())
      && (statusFilter === 'all' || ua.is_status === statusFilter)
      && (!roleFilter || ua.role === roleFilter)
      && (!companyFilter || ua.company_id === companyFilter)
  }), [enriched, search, statusFilter, roleFilter, companyFilter])

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('users', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('users', 'employeeAccounts')} {stats.totalEmployees} · {t('users', 'driverAccounts')} {stats.totalDrivers} · Accounts {stats.totalAccounts}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>{t('common', 'export')}</Button>
          <Button variant="secondary" size="sm" icon={<Users size={13} />} onClick={() => openModal('bulk-add-user-account')}>{t('users', 'bulkCreate')}</Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-user-account')}>{t('users', 'createAccount')}</Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{t('users', 'allAccounts')}</p>
          <p className="text-2xl font-bold text-slate-800">{stats.totalAccounts}</p>
          <p className="text-[10px] text-slate-400 mt-1">{stats.activeAccounts} {t('common', 'active')}</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          <div className="flex items-center gap-1.5 mb-1"><User2 size={11} className="text-violet-500" /><p className="text-[10px] text-violet-500 uppercase font-semibold">{t('users', 'employeeAccounts')}</p></div>
          <p className="text-2xl font-bold text-violet-700">{stats.totalEmployees}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5"><CheckCircle2 size={9} /> {stats.empWithAccount} {t('users', 'hasAccount')}</span>
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5"><AlertCircle size={9} /> {stats.empNoAccount} {t('users', 'noAccount')}</span>
          </div>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
          <div className="flex items-center gap-1.5 mb-1"><UserCheck size={11} className="text-sky-500" /><p className="text-[10px] text-sky-500 uppercase font-semibold">{t('users', 'driverAccounts')}</p></div>
          <p className="text-2xl font-bold text-sky-700">{stats.totalDrivers}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5"><CheckCircle2 size={9} /> {stats.drvWithAccount} {t('users', 'hasAccount')}</span>
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5"><AlertCircle size={9} /> {stats.drvNoAccount} {t('users', 'noAccount')}</span>
          </div>
        </div>
        <div className={`rounded-xl border p-4 ${stats.empNoAccount + stats.drvNoAccount > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
          {stats.empNoAccount + stats.drvNoAccount > 0 ? (
            <>
              <div className="flex items-center gap-1.5 mb-1"><AlertCircle size={11} className="text-amber-500" /><p className="text-[10px] text-amber-600 uppercase font-semibold">{t('users', 'noAccount')}</p></div>
              <p className="text-2xl font-bold text-amber-700">{stats.empNoAccount + stats.drvNoAccount}</p>
              <button onClick={() => { setTab('employees'); setSearch('') }} className="text-[10px] text-amber-600 underline mt-1">{t('users', 'viewList')}</button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mb-1"><CheckCircle2 size={11} className="text-emerald-500" /><p className="text-[10px] text-emerald-600 uppercase font-semibold">{t('users', 'allComplete')}</p></div>
              <p className="text-sm font-bold text-emerald-700 mt-1">{t('users', 'everyoneHas')}</p>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-slate-200">
        {([
          { key: 'employees', label: t('users', 'employeeAccounts'), icon: <User2 size={13} />, count: stats.totalEmployees },
          { key: 'drivers', label: t('users', 'driverAccounts'), icon: <UserCheck size={13} />, count: stats.totalDrivers },
          { key: 'accounts', label: 'Accounts', icon: <Shield size={13} />, count: stats.totalAccounts },
        ] as { key: Tab; label: string; icon: React.ReactNode; count: number }[]).map(tabItem => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${tab === tabItem.key ? 'border-sky-500 text-sky-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {tabItem.icon} {tabItem.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === tabItem.key ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>{tabItem.count}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 mb-1">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search size={12} className="text-slate-400 flex-shrink-0" />
            <input className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-44" placeholder={t('common', 'search') + '...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white outline-none" value={statusFilter} onChange={e => setStatus(e.target.value as any)}>
            <option value="all">{t('users', 'allStatuses')}</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {tab === 'accounts' && (
            <>
              <select className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white outline-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
                <option value="">{t('users', 'allRoles')}</option>
                {(['super_admin', 'admin', 'operator', 'viewer', 'driver', 'employee'] as UserRole[]).map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
              </select>
              <select className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white outline-none" value={companyFilter} onChange={e => setCompany(e.target.value)}>
                <option value="">{t('users', 'allCompanies')}</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Tab: Employees */}
      {tab === 'employees' && (
        <Card padding="sm">
          <Table>
            <thead><tr>
              <Th>{t('common', 'code')}</Th><Th>{t('users', 'fullName')}</Th><Th>{t('users', 'deptLabel')}</Th>
              <Th>{t('users', 'empStatus')}</Th><Th>{t('users', 'account')}</Th><Th>{t('users', 'role')}</Th><Th>{t('common', 'actions')}</Th>
            </tr></thead>
            <tbody>
              {filteredEmployees.map(e => {
                const ua = accountByEmpId.get(e.id)
                return (
                  <tr key={e.id} className="table-row-hover transition-colors">
                    <Td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{e.code}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">{e.first_name_th.charAt(0)}</div>
                        <div><p className="text-xs font-semibold text-slate-700">{e.first_name_th} {e.last_name_th}</p><p className="text-[10px] text-slate-400">{e.first_name_en} {e.last_name_en}</p></div>
                      </div>
                    </Td>
                    <Td><span className="text-xs text-slate-600">{e.defaults?.organizationUnit?.nameTh ?? '-'}</span></Td>
                    <Td><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(e.is_status)}`}>{getStatusLabel(e.is_status)}</span></Td>
                    <Td>
                      {ua ? (
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-emerald-500" /><span className="text-xs font-mono text-slate-700">{ua.username}</span></div>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500"><AlertCircle size={10} /> {t('users', 'noAccount')}</span>
                      )}
                    </Td>
                    <Td>{ua ? <Badge variant={getRoleBadgeVariant(ua.role)}>{getRoleLabel(ua.role)}</Badge> : <span className="text-[10px] text-slate-300">-</span>}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openModal('view-employee', e)} className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"><Eye size={13} /></button>
                        <button onClick={() => openModal('edit-employee', e)} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                        {ua ? (
                          <button onClick={() => openModal('edit-user-account', ua)} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="แก้ไข role / รหัสผ่าน"><Key size={13} /></button>
                        ) : (
                          <button onClick={() => openModal('add-user-account', { prefill_employee_id: e.id })} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors">
                            <Plus size={10} /> {t('users', 'createAccount')}
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )
              })}
              {!filteredEmployees.length && <tr><td colSpan={7} className="text-center py-10 text-xs text-slate-400">{t('users', 'notFound')}</td></tr>}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Tab: Drivers */}
      {tab === 'drivers' && (
        <Card padding="sm">
          <Table>
            <thead><tr>
              <Th>{t('common', 'code')}</Th><Th>{t('users', 'fullName')}</Th><Th>{t('users', 'vehicleCode')}</Th>
              <Th>{t('common', 'phone')}</Th><Th>{t('common', 'status')}</Th><Th>{t('users', 'account')}</Th><Th>{t('common', 'actions')}</Th>
            </tr></thead>
            <tbody>
              {filteredDrivers.map(d => {
                const ua = accountByDrvId.get(d.id)
                const license = vehicleByDrvId.get(d.id)
                return (
                  <tr key={d.id} className="table-row-hover transition-colors">
                    <Td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{d.code}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">{d.first_name_th.charAt(0)}</div>
                        <div><p className="text-xs font-semibold text-slate-700">{d.first_name_th} {d.last_name_th}</p><p className="text-[10px] text-slate-400">{d.first_name_en} {d.last_name_en}</p></div>
                      </div>
                    </Td>
                    <Td>{license ? <span className="flex items-center gap-1 text-xs font-mono font-bold text-slate-700"><Bus size={11} className="text-emerald-500" />{license}</span> : <span className="text-[10px] text-amber-500">{t('vehicles', 'noDriverAssigned')}</span>}</Td>
                    <Td><span className="text-xs font-mono text-sky-600">{d.tel ?? '-'}</span></Td>
                    <Td><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(d.is_status)}`}>{getStatusLabel(d.is_status)}</span></Td>
                    <Td>
                      {ua ? (
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-emerald-500" /><span className="text-xs font-mono text-slate-700">{ua.username}</span></div>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500"><AlertCircle size={10} /> {t('users', 'noAccount')}</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openModal('assign-driver-vehicle', d)} className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Bus size={13} /></button>
                        {ua ? (
                          <button onClick={() => openModal('edit-user-account', ua)} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="แก้ไข role / รหัสผ่าน"><Key size={13} /></button>
                        ) : (
                          <button onClick={() => openModal('add-user-account')} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors">
                            <Plus size={10} /> {t('users', 'createAccount')}
                          </button>
                        )}
                        <button onClick={() => openModal('delete-driver', d)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
              {!filteredDrivers.length && <tr><td colSpan={7} className="text-center py-10 text-xs text-slate-400">{t('users', 'notFound')}</td></tr>}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Tab: Accounts */}
      {tab === 'accounts' && (
        <Card padding="sm">
          <Table>
            <thead><tr>
              <Th>Username</Th><Th>{t('common', 'type')}</Th><Th>{t('common', 'name')}</Th>
              <Th>Contact</Th><Th>{t('users', 'role')}</Th><Th>{t('common', 'company')}</Th><Th>{t('common', 'status')}</Th><Th>{t('common', 'actions')}</Th>
            </tr></thead>
            <tbody>
              {filteredAccounts.map(ua => {
                const person = ua.employee ?? ua.driver
                const personName = person ? `${(person as any).first_name_th} ${(person as any).last_name_th}` : 'Standalone Admin'
                const typeColor = ua.account_type === 'employee' ? 'from-violet-400 to-purple-500' : ua.account_type === 'driver' ? 'from-sky-400 to-blue-500' : 'from-indigo-500 to-violet-600'
                return (
                  <tr key={ua.id} className="table-row-hover transition-colors">
                    <Td><div className="flex items-center gap-1.5"><Key size={11} className="text-slate-400" /><span className="text-xs font-mono font-bold text-slate-700">{ua.username}</span></div></Td>
                    <Td>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${ua.account_type === 'employee' ? 'bg-violet-50 text-violet-700 border-violet-200' : ua.account_type === 'driver' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        {ua.account_type === 'employee' ? t('users', 'employeeAccounts') : ua.account_type === 'driver' ? t('users', 'driverAccounts') : 'Admin'}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${typeColor} flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0`}>{personName.charAt(0)}</div>
                        <span className="text-xs text-slate-700">{personName}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="space-y-0.5">
                        {ua.email && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Mail size={9} />{ua.email}</div>}
                        {ua.tel && <div className="flex items-center gap-1 text-[10px] text-sky-600 font-mono"><Phone size={9} />{ua.tel}</div>}
                        {!ua.email && !ua.tel && <span className="text-[10px] text-slate-300">-</span>}
                      </div>
                    </Td>
                    <Td><Badge variant={getRoleBadgeVariant(ua.role)}>{getRoleLabel(ua.role)}</Badge></Td>
                    <Td><span className="text-xs text-slate-600">{ua.company?.name_th ?? t('users', 'allCompanies')}</span></Td>
                    <Td><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(ua.is_status)}`}>{getStatusLabel(ua.is_status)}</span></Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openModal('view-user-account', ua)} className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"><Eye size={13} /></button>
                        <button onClick={() => openModal('edit-user-account', ua)} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => toggleUserAccountStatus(ua.id)} className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title={ua.is_status === 'active' ? t('common', 'disable') : t('common', 'enable')}>
                          {ua.is_status === 'active' ? <ToggleRight size={13} className="text-emerald-500" /> : <ToggleLeft size={13} />}
                        </button>
                        <button onClick={() => openModal('delete-user-account', ua)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
              {!filteredAccounts.length && <tr><td colSpan={8} className="text-center py-10 text-xs text-slate-400">{t('users', 'notFound')}</td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
