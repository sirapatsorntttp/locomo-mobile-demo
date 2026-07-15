'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Truck, Plus, Search, Trash2, Pencil, ToggleLeft, ToggleRight,
  Building2, MapPin, X, Link2,
} from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/stores/useVendorStore'
import { getStatusColor, getStatusLabel, cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { AddVendorModal, EditVendorModal, DeleteVendorModal } from '@/components/modals/VendorModals'
import { useCompanyStore } from '@/lib/stores/company.store'
import { usePlantStore } from '@/lib/stores/plant.store'

type TabType = 'vendors' | 'company' | 'plants'

export default function VendorsPage() {
  const { openModal } = useStore()

  const { plants, loadPlants } = usePlantStore()
  const { companies, loadCompanies } = useCompanyStore()
  const { vendors, companyVendors, plantVendorServices, assignVendorCompany, removeVendorCompany,
    addVendorPlant, removeVendorPlant, loadVendors
  } = useVendorStore()
  const { t, lang } = useLang()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabType>('vendors')
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)

  // Company assignment form
  const [assignCompanyId, setAssignCompanyId] = useState('')
  // Plant assignment form
  const [assignPlantId, setAssignPlantId] = useState('')
  useEffect(() => {
    loadVendors()
    loadCompanies()
    loadPlants()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return vendors.filter(v =>
      !q || v.name_th.toLowerCase().includes(q) || v.name_en.toLowerCase().includes(q) || v.code.toLowerCase().includes(q)
    )
  }, [vendors, search])

  const selectedVendor = vendors.find(v => v.id === selectedVendorId) ?? null

  const vendorCompany = selectedVendorId
    ? companyVendors.find(cv => cv.vendor_id === selectedVendorId)
    : null

  const vendorPlants = selectedVendorId
    ? plantVendorServices.filter(pvs => pvs.vendor_id === selectedVendorId)
    : []

  const stats = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter(v => v.is_status === 'active').length,
    plant: plantVendorServices.length,
  }), [vendors, plantVendorServices])

  const tabs: { key: TabType; labelTh: string; labelEn: string }[] = [
    { key: 'vendors', labelTh: 'Vendors', labelEn: 'Vendors' },
    { key: 'company', labelTh: 'บริษัทที่สังกัด', labelEn: 'Company' },
    { key: 'plants', labelTh: 'พื้นที่ให้บริการ', labelEn: 'Plant Services' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('vendors', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('vendors', 'subtitle')}</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-vendor')}>
          {t('vendors', 'addVendor')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Vendors ทั้งหมด', value: stats.total, bg: 'bg-violet-50 border-violet-100', text: 'text-violet-700' },
          { label: 'Vendors active', value: stats.active, bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
          { label: 'Plant Services', value: stats.plant, bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
        ].map(s => (
          <Card key={s.label} className={cn('p-4 border', s.bg)}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.text)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        {/* Tabs + Search */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100 flex-wrap gap-y-2">
          <div className="flex gap-1">
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
                  tab === tb.key
                    ? 'bg-violet-100 text-violet-700 border-violet-200'
                    : 'text-slate-500 hover:bg-slate-50 border-transparent'
                )}>
                {lang === 'th' ? tb.labelTh : tb.labelEn}
              </button>
            ))}
          </div>
          {tab === 'vendors' && (
            <div className="relative w-56">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัส..."
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-300 bg-slate-50" />
            </div>
          )}
        </div>

        {/* ── TAB: VENDORS ── */}
        {tab === 'vendors' && (
          <Table>
            <thead>
              <tr>
                <Th>{t('common', 'code')}</Th>
                <Th>ชื่อ Vendor</Th>
                <Th>บริษัทที่สังกัด</Th>
                <Th>{t('common', 'status')}</Th>
                <Th className="text-right">{t('common', 'actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-xs text-slate-400">{t('common', 'noData')}</td></tr>
              ) : filtered.map(v => {
                const cv = companyVendors.find(x => x.vendor_id === v.id)
                const companyName = cv ? companies.find(c => c.id === cv.company_id)?.name_th : null
                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <Td><span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{v.code}</span></Td>
                    <Td>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">{v.name_th}</p>
                        <p className="text-[10px] text-slate-400">{v.name_en}</p>
                      </div>
                    </Td>
                    <Td>
                      {companyName
                        ? <span className="text-[11px] text-sky-600 font-semibold flex items-center gap-1"><Building2 size={10} />{companyName}</span>
                        : <span className="text-[10px] text-slate-300 italic">ยังไม่ระบุ</span>
                      }
                    </Td>
                    <Td>
                      <Badge className={getStatusColor(v.is_status)}>{getStatusLabel(v.is_status)}</Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button title="จัดการ relations" onClick={() => { setSelectedVendorId(v.id); setTab('company') }}
                          className="p-1.5 rounded-md hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors">
                          <Link2 size={13} />
                        </button>
                        <button onClick={() => openModal('edit-vendor', v)}
                          className="p-1.5 rounded-md hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => openModal('delete-vendor', v)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}

        {/* ── TAB: COMPANY ASSIGNMENT ── */}
        {tab === 'company' && (
          <div className="p-4 space-y-4">
            {/* Vendor selector */}
            <VendorSelector vendors={vendors} selectedId={selectedVendorId} onChange={setSelectedVendorId} />

            {selectedVendor ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600">บริษัทที่สังกัด (companys_vendors)</p>
                <p className="text-[10px] text-slate-400">vendor_id unique — Vendor 1 ราย สังกัดได้ 1 บริษัท</p>

                {vendorCompany ? (
                  <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Building2 size={16} className="text-sky-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          {companies.find(c => c.id === vendorCompany.company_id)?.name_th ?? vendorCompany.company_id}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {companies.find(c => c.id === vendorCompany.company_id)?.code}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeVendorCompany(selectedVendor.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select value={assignCompanyId} onChange={e => setAssignCompanyId(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-white">
                      <option value="">-- เลือกบริษัท --</option>
                      {companies.filter(c => c.is_status === 'active').map(c => (
                        <option key={c.id} value={c.id}>{c.name_th} ({c.code})</option>
                      ))}
                    </select>
                    <Button variant="primary" size="sm" onClick={() => {
                      if (!assignCompanyId) return
                      assignVendorCompany(selectedVendor.id, assignCompanyId)
                      setAssignCompanyId('')
                    }}>กำหนด</Button>
                  </div>
                )}
              </div>
            ) : (
              <EmptySelection message="เลือก Vendor เพื่อจัดการบริษัทที่สังกัด" />
            )}
          </div>
        )}

        {/* ── TAB: PLANT SERVICES ── */}
        {tab === 'plants' && (
          <div className="p-4 space-y-4">
            <VendorSelector vendors={vendors} selectedId={selectedVendorId} onChange={setSelectedVendorId} />

            {selectedVendor ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600">พื้นที่ให้บริการ (plants_vendors_services)</p>
                <p className="text-[10px] text-slate-400">unique (plant_id, vendor_id) — สามารถให้บริการได้หลาย Plant</p>

                {vendorPlants.length > 0 ? (
                  <div className="space-y-2">
                    {vendorPlants.map(pvs => {
                      const plant = plants.find(p => p.id === pvs.plant_id)
                      return (
                        <div key={pvs.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <MapPin size={14} className="text-amber-500" />
                            <div>
                              <p className="text-xs font-bold text-slate-700">{plant?.name_th ?? pvs.plant_id}</p>
                              <p className="text-[10px] font-mono text-slate-400">{plant?.code}</p>
                            </div>
                          </div>
                          <button onClick={() => removeVendorPlant(selectedVendor.id, pvs.plant_id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">ยังไม่มีพื้นที่ให้บริการ</p>
                )}

                {/* Add plant */}
                <div className="flex items-center gap-2 pt-1">
                  <select value={assignPlantId} onChange={e => setAssignPlantId(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 bg-white">
                    <option value="">-- เพิ่ม Plant --</option>
                    {plants
                      .filter(p => !vendorPlants.some(pvs => pvs.plant_id === p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name_th} ({p.code})</option>
                      ))}
                  </select>
                  <Button variant="primary" size="sm" onClick={() => {
                    if (!assignPlantId) return
                    addVendorPlant(selectedVendor.id, assignPlantId)
                    setAssignPlantId('')
                  }}>เพิ่ม</Button>
                </div>
              </div>
            ) : (
              <EmptySelection message="เลือก Vendor เพื่อจัดการพื้นที่ให้บริการ" />
            )}
          </div>
        )}

        {/* Footer count */}
        {tab === 'vendors' && filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400">
            แสดง {filtered.length} จาก {vendors.length} รายการ
          </div>
        )}
      </Card>

      {/* Modals */}
      <AddVendorModal />
      <EditVendorModal />
      <DeleteVendorModal />
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────

function VendorSelector({
  vendors,
  selectedId,
  onChange,
}: {
  vendors: import('@/types').Vendor[]
  selectedId: string | null
  onChange: (id: string) => void
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">เลือก Vendor</p>
      <select
        value={selectedId ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full max-w-xs text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-300 bg-white"
      >
        <option value="">-- เลือก Vendor --</option>
        {vendors.filter(v => v.is_status === 'active').map(v => (
          <option key={v.id} value={v.id}>{v.name_th} ({v.code})</option>
        ))}
      </select>
    </div>
  )
}

function EmptySelection({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <Truck size={32} className="text-slate-200 mx-auto mb-3" />
      <p className="text-xs text-slate-400">{message}</p>
    </div>
  )
}
