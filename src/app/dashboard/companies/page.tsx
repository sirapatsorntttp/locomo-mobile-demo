'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Building2, Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  Shield, Users, Truck, MapPin, X, Link2,
} from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/stores/useVendorStore'
import { getStatusColor, getStatusLabel, cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { AddCompanyModal, EditCompanyModal, DeleteCompanyModal } from '@/components/modals/OtherModals'
import type { CompanyType } from '@/types'
import { usePlantStore } from '@/lib/stores/plant.store'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useCompanyStore } from '@/lib/stores/company.store'

type MainTab = 'companies' | 'plants' | 'employees' | 'vendors'
type FilterTab = 'all' | CompanyType

const TYPE_META: Record<CompanyType, { labelTh: string; labelEn: string; color: string; icon: React.ReactNode }> = {
  internal: { labelTh: 'Internal', labelEn: 'Internal', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: <Shield size={10} /> },
  customer: { labelTh: 'Customer', labelEn: 'Customer', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: <Users size={10} /> },
  vendor: { labelTh: 'Vendor', labelEn: 'Vendor', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Truck size={10} /> },
}

export default function CompaniesPage() {
  const { openModal } = useStore()

  const {
    companies, companyPlants, companyPlantEmployees, toggleCompanyStatus, loadCompanies,
    addCompanyPlant, removeCompanyPlant,
    addCompanyPlantEmployee, removeCompanyPlantEmployee } = useCompanyStore()
  const { plants } = usePlantStore()
  const { vendors, companyVendors, loadVendors } = useVendorStore()
  const { employees } = useEmployeeStore()
  const { t, lang } = useLang()

  const [mainTab, setMainTab] = useState<MainTab>('companies')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [assignPlantId, setAssignPlantId] = useState('')
  const [assignEmpId, setAssignEmpId] = useState('')

  useEffect(() => { loadCompanies() }, [loadCompanies])

  const stats = useMemo(() => ({
    total: companies.length,
    internal: companies.filter(c => c.company_type === 'internal').length,
    customer: companies.filter(c => c.company_type === 'customer').length,
    vendor: companies.filter(c => c.company_type === 'vendor').length,
    active: companies.filter(c => c.is_status === 'active').length,
  }), [companies])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return companies.filter(c => {
      const matchTab = filterTab === 'all' || c.company_type === filterTab
      const matchSearch = !q || c.name_th.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [companies, filterTab, search])

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) ?? null

  // Plants of selected company
  const companyPlantList = selectedCompanyId
    ? companyPlants.filter(cp => cp.company_id === selectedCompanyId)
    : []

  // Employees of selected company+plant
  const selectedCompanyPlant = companyPlantList.find(cp => cp.plant_id === selectedPlantId)
  const plantEmployeeList = selectedCompanyPlant
    ? companyPlantEmployees.filter(cpe => cpe.company_plant_id === selectedCompanyPlant.id)
    : []

  // Vendors of selected company
  const companyVendorList = selectedCompanyId
    ? companyVendors.filter(cv => cv.company_id === selectedCompanyId)
    : []

  // Unassigned plants (not yet assigned to any company)
  const unassignedPlants = plants.filter(
    p => !companyPlants.some(cp => cp.plant_id === p.id)
  )

  // Unassigned employees (not yet assigned to any company-plant)
  const unassignedEmployees = employees.filter(
    e => !companyPlantEmployees.some(cpe => cpe.employee_id === e.id)
  )

  const filterTabs: { key: FilterTab; labelTh: string; labelEn: string; count: number }[] = [
    { key: 'all', labelTh: 'ทั้งหมด', labelEn: 'All', count: companies.length },
    { key: 'internal', labelTh: 'Internal', labelEn: 'Internal', count: stats.internal },
    { key: 'customer', labelTh: 'Customer', labelEn: 'Customer', count: stats.customer },
    { key: 'vendor', labelTh: 'Vendor', labelEn: 'Vendor', count: stats.vendor },
  ]

  const mainTabs: { key: MainTab; labelTh: string; labelEn: string }[] = [
    { key: 'companies', labelTh: 'บริษัท', labelEn: 'Companies' },
    { key: 'plants', labelTh: 'Plants ที่สังกัด', labelEn: 'Plants' },
    { key: 'employees', labelTh: 'พนักงาน', labelEn: 'Employees' },
    { key: 'vendors', labelTh: 'Vendors', labelEn: 'Vendors' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('companies', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('companies', 'subtitle')}</p>
        </div>
        {mainTab === 'companies' && (
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-company')}>
            {t('companies', 'addCompany')}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('companies', 'statTotal'), value: stats.total, bg: 'bg-slate-50 border-slate-100', text: 'text-slate-700' },
          { label: 'Internal', value: stats.internal, bg: 'bg-violet-50 border-violet-100', text: 'text-violet-700' },
          { label: t('companies', 'statCustomer'), value: stats.customer, bg: 'bg-sky-50 border-sky-100', text: 'text-sky-700' },
          { label: t('companies', 'statVendor'), value: stats.vendor, bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
        ].map(s => (
          <Card key={s.label} className={cn('p-4 border', s.bg)}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.text)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        {/* Main Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100 pb-0">
          {mainTabs.map(tb => (
            <button key={tb.key} onClick={() => setMainTab(tb.key)}
              className={cn(
                'px-4 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px',
                mainTab === tb.key
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}>
              {lang === 'th' ? tb.labelTh : tb.labelEn}
            </button>
          ))}
        </div>

        {/* ── TAB: COMPANIES ── */}
        {mainTab === 'companies' && (
          <>
            {/* Filter tabs + search */}
            <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
              <div className="flex gap-1">
                {filterTabs.map(tb => (
                  <button key={tb.key} onClick={() => setFilterTab(tb.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
                      filterTab === tb.key
                        ? 'bg-sky-100 text-sky-700 border-sky-200'
                        : 'text-slate-500 hover:bg-slate-50 border-transparent'
                    )}>
                    {lang === 'th' ? tb.labelTh : tb.labelEn}
                    <span className={cn('text-[9px] px-1.5 py-px rounded-full font-bold',
                      filterTab === tb.key ? 'bg-sky-200 text-sky-700' : 'bg-slate-100 text-slate-500')}>
                      {tb.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative w-56">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={lang === 'th' ? 'ค้นหาชื่อ, รหัส...' : 'Search name, code...'}
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-300 bg-slate-50" />
              </div>
            </div>

            <Table>
              <thead>
                <tr>
                  <Th>{t('companies', 'colCode')}</Th>
                  <Th>{t('companies', 'colName')}</Th>
                  <Th>{t('companies', 'colType')}</Th>
                  <Th>Plants</Th>
                  <Th>{t('companies', 'colAddress')}</Th>
                  <Th>{t('companies', 'colStatus')}</Th>
                  <Th className="text-right">{t('companies', 'colActions')}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-xs text-slate-400">{t('common', 'noData')}</td></tr>
                ) : filtered.map(c => {
                  const meta = TYPE_META[c.company_type]
                  const plantCount = companyPlants.filter(cp => cp.company_id === c.id).length
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <Td><span className="font-mono text-xs font-bold text-slate-600">{c.code}</span></Td>
                      <Td>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{c.name_th}</p>
                          <p className="text-[10px] text-slate-400">{c.name_en}</p>
                        </div>
                      </Td>
                      <Td>
                        <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', meta.color)}>
                          {meta.icon}{lang === 'th' ? meta.labelTh : meta.labelEn}
                        </span>
                      </Td>
                      <Td>
                        <button onClick={() => { setSelectedCompanyId(c.id); setMainTab('plants') }}
                          className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full hover:bg-sky-100 transition-colors">
                          {plantCount} plants
                        </button>
                      </Td>
                      <Td>
                        <span className="text-[11px] text-slate-500 max-w-[200px] truncate block">
                          {c.address ?? <span className="text-slate-300 italic">{t('companies', 'noAddress')}</span>}
                        </span>
                      </Td>
                      <Td><Badge className={getStatusColor(c.is_status)}>{getStatusLabel(c.is_status)}</Badge></Td>
                      <Td className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => toggleCompanyStatus(c.id)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            {c.is_status === 'active' ? <ToggleRight size={14} className="text-emerald-500" /> : <ToggleLeft size={14} />}
                          </button>
                          <button onClick={() => openModal('edit-company', c)}
                            className="p-1.5 rounded-md hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => openModal('delete-company', c)}
                            disabled={c.company_type === 'internal'}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            {filtered.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400">
                {lang === 'th' ? `แสดง ${filtered.length} จาก ${companies.length} รายการ` : `Showing ${filtered.length} of ${companies.length} items`}
              </div>
            )}
          </>
        )}

        {/* ── TAB: PLANTS ── */}
        {mainTab === 'plants' && (
          <div className="p-4 space-y-4">
            <CompanySelector companies={companies} selectedId={selectedCompanyId} onChange={id => { setSelectedCompanyId(id); setSelectedPlantId(null) }} />

            {selectedCompany ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600">Plants ที่สังกัด (companys_plants)</p>
                <p className="text-[10px] text-slate-400">plant_id unique — 1 plant สังกัดได้ 1 บริษัท</p>

                {companyPlantList.length > 0 ? (
                  <div className="space-y-2">
                    {companyPlantList.map(cp => {
                      const plant = plants.find(p => p.id === cp.plant_id)
                      const empCount = companyPlantEmployees.filter(cpe => cpe.company_plant_id === cp.id).length
                      return (
                        <div key={cp.id} className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <MapPin size={14} className="text-sky-500" />
                            <div>
                              <p className="text-xs font-bold text-slate-700">{plant?.name_th ?? cp.plant_id}</p>
                              <p className="text-[10px] font-mono text-slate-400">{plant?.code} · {empCount} พนักงาน</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setSelectedPlantId(cp.plant_id); setMainTab('employees') }}
                              className="text-[10px] px-2 py-1 rounded-lg bg-sky-100 text-sky-600 hover:bg-sky-200 font-semibold transition-colors">
                              ดูพนักงาน
                            </button>
                            <button onClick={() => removeCompanyPlant(selectedCompany.id, cp.plant_id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">ยังไม่มี Plant</p>
                )}

                {unassignedPlants.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <select value={assignPlantId} onChange={e => setAssignPlantId(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-white">
                      <option value="">-- เพิ่ม Plant --</option>
                      {unassignedPlants.map(p => (
                        <option key={p.id} value={p.id}>{p.name_th} ({p.code})</option>
                      ))}
                    </select>
                    <Button variant="primary" size="sm" onClick={() => {
                      if (!assignPlantId) return
                      addCompanyPlant(selectedCompany.id, assignPlantId)
                      setAssignPlantId('')
                    }}>เพิ่ม</Button>
                  </div>
                )}
                {unassignedPlants.length === 0 && companyPlantList.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">Plants ทั้งหมดถูกกำหนดแล้ว</p>
                )}
              </div>
            ) : (
              <EmptySelection message="เลือกบริษัทเพื่อจัดการ Plants" icon={<MapPin size={32} className="text-slate-200 mx-auto mb-3" />} />
            )}
          </div>
        )}

        {/* ── TAB: EMPLOYEES ── */}
        {mainTab === 'employees' && (
          <div className="p-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <CompanySelector companies={companies} selectedId={selectedCompanyId}
                  onChange={id => { setSelectedCompanyId(id); setSelectedPlantId(null) }} />
              </div>
              {selectedCompanyId && (
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">เลือก Plant</p>
                  <select value={selectedPlantId ?? ''} onChange={e => setSelectedPlantId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-white">
                    <option value="">-- เลือก Plant --</option>
                    {companyPlantList.map(cp => {
                      const plant = plants.find(p => p.id === cp.plant_id)
                      return <option key={cp.id} value={cp.plant_id}>{plant?.name_th ?? cp.plant_id} ({plant?.code})</option>
                    })}
                  </select>
                </div>
              )}
            </div>

            {selectedCompany && selectedCompanyPlant ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600">พนักงานที่สังกัด (companys_plants_employees)</p>
                <p className="text-[10px] text-slate-400">employee_id unique — พนักงาน 1 คน สังกัดได้ 1 company-plant</p>

                {plantEmployeeList.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <Th>รหัส</Th>
                        <Th>ชื่อพนักงาน</Th>
                        <Th>Email</Th>
                        <Th className="text-right">ยกเลิก</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {plantEmployeeList.map(cpe => {
                        const emp = employees.find(e => e.id === cpe.employee_id)
                        return (
                          <tr key={cpe.id} className="hover:bg-slate-50">
                            <Td><span className="font-mono text-xs text-slate-500">{emp?.code ?? cpe.employee_id}</span></Td>
                            <Td>
                              <p className="text-xs font-semibold text-slate-700">{emp ? `${emp.first_name_th} ${emp.last_name_th}` : '-'}</p>
                              <p className="text-[10px] text-slate-400">{emp ? `${emp.first_name_en} ${emp.last_name_en}` : ''}</p>
                            </Td>
                            <Td><span className="text-xs text-slate-500">{emp?.email ?? '-'}</span></Td>
                            <Td className="text-right">
                              <button onClick={() => removeCompanyPlantEmployee(selectedCompany.id, selectedCompanyPlant.plant_id, cpe.employee_id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                <X size={13} />
                              </button>
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-xs text-slate-400 italic">ยังไม่มีพนักงาน</p>
                )}

                {unassignedEmployees.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <select value={assignEmpId} onChange={e => setAssignEmpId(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-white">
                      <option value="">-- เพิ่มพนักงาน --</option>
                      {unassignedEmployees.filter(e => e.is_status === 'active').map(e => (
                        <option key={e.id} value={e.id}>{e.first_name_th} {e.last_name_th} ({e.code})</option>
                      ))}
                    </select>
                    <Button variant="primary" size="sm" onClick={() => {
                      if (!assignEmpId) return
                      addCompanyPlantEmployee(selectedCompany.id, selectedCompanyPlant.plant_id, assignEmpId)
                      setAssignEmpId('')
                    }}>กำหนด</Button>
                  </div>
                )}
              </div>
            ) : (
              <EmptySelection message="เลือกบริษัทและ Plant เพื่อจัดการพนักงาน" icon={<Users size={32} className="text-slate-200 mx-auto mb-3" />} />
            )}
          </div>
        )}

        {/* ── TAB: VENDORS ── */}
        {mainTab === 'vendors' && (
          <div className="p-4 space-y-4">
            <CompanySelector companies={companies} selectedId={selectedCompanyId} onChange={setSelectedCompanyId} />

            {selectedCompany ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600">Vendors ที่สังกัด (companys_vendors)</p>
                <p className="text-[10px] text-slate-400">vendor_id unique — Vendor 1 ราย สังกัดได้ 1 บริษัท · จัดการได้จากหน้า Vendors</p>

                {companyVendorList.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <Th>รหัส</Th>
                        <Th>ชื่อ Vendor</Th>
                        <Th>{t('common', 'status')}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyVendorList.map(cv => {
                        const vendor = vendors.find(v => v.id === cv.vendor_id)
                        return (
                          <tr key={cv.id} className="hover:bg-slate-50">
                            <Td><span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{vendor?.code ?? cv.vendor_id}</span></Td>
                            <Td>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs">{vendor?.name_th ?? '-'}</p>
                                <p className="text-[10px] text-slate-400">{vendor?.name_en}</p>
                              </div>
                            </Td>
                            <Td>
                              {vendor && <Badge className={getStatusColor(vendor.is_status)}>{getStatusLabel(vendor.is_status)}</Badge>}
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-xs text-slate-400 italic">ยังไม่มี Vendor · ไปกำหนดได้ที่หน้า Vendors</p>
                )}
              </div>
            ) : (
              <EmptySelection message="เลือกบริษัทเพื่อดู Vendors ที่สังกัด" icon={<Truck size={32} className="text-slate-200 mx-auto mb-3" />} />
            )}
          </div>
        )}
      </Card>

      {/* Modals */}
      <AddCompanyModal />
      <EditCompanyModal />
      <DeleteCompanyModal />
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────

function CompanySelector({
  companies,
  selectedId,
  onChange,
}: {
  companies: import('@/types').Company[]
  selectedId: string | null
  onChange: (id: string) => void
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">เลือกบริษัท</p>
      <select value={selectedId ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full max-w-xs text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-white">
        <option value="">-- เลือกบริษัท --</option>
        {companies.filter(c => c.is_status === 'active').map(c => (
          <option key={c.id} value={c.id}>{c.name_th} ({c.code})</option>
        ))}
      </select>
    </div>
  )
}

function EmptySelection({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      {icon}
      <p className="text-xs text-slate-400">{message}</p>
    </div>
  )
}
