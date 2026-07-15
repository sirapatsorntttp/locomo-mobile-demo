'use client'
import { useEffect, useMemo, useState } from 'react'
import { MapPin, Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel, cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { AddPlantModal, EditPlantModal, DeletePlantModal } from '@/components/modals/OtherModals'
import { useCompanyStore } from '@/lib/stores/company.store'
import { usePlantStore } from '@/lib/stores/plant.store'

export default function PlantsPage() {
  const {
    openModal,
  } = useStore()
  const { plants, loadPlants, togglePlantStatus } = usePlantStore()
  const { companies, companyPlants, loadCompanies } = useCompanyStore()
  const { lang } = useLang()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadPlants()
    loadCompanies()
  }, [loadPlants, loadCompanies])

  // ── Build a map: plant_id → company ─────────────────────────
  const plantCompanyMap = useMemo(() => {
    const map = new Map<string, (typeof companies)[0]>()
    companyPlants.forEach(cp => {
      const company = companies.find(c => c.id === cp.company_id)
      if (company) map.set(cp.plant_id, company)
    })
    return map
  }, [companyPlants, companies])

  const filtered = useMemo(() => {
    return plants.filter(p => {
      if (statusFilter !== 'all' && p.is_status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return p.code.toLowerCase().includes(q) || p.name_th.includes(q) || p.name_en.toLowerCase().includes(q)
      }
      return true
    })
  }, [plants, search, statusFilter])

  const stats = useMemo(() => ({
    total: plants.length,
    active: plants.filter(p => p.is_status === 'active').length,
    assigned: plants.filter(p => plantCompanyMap.has(p.id)).length,
    unassigned: plants.filter(p => !plantCompanyMap.has(p.id)).length,
  }), [plants, plantCompanyMap])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin size={20} className="text-sky-500" />
            {lang === 'th' ? 'โรงงาน' : 'Plant Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">plants table · {lang === 'th' ? 'สถานที่ตั้งของลูกค้า' : 'Customer site locations'}</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openModal('add-plant')}>
          {lang === 'th' ? 'เพิ่มพื้นที่' : 'Add Plant'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: lang === 'th' ? 'ทั้งหมด' : 'Total', value: stats.total, color: 'text-slate-700' },
          { label: lang === 'th' ? 'ใช้งาน' : 'Active', value: stats.active, color: 'text-emerald-600' },
          { label: lang === 'th' ? 'มีบริษัทสังกัด' : 'Assigned', value: stats.assigned, color: 'text-sky-600' },
          { label: lang === 'th' ? 'ยังไม่สังกัด' : 'Unassigned', value: stats.unassigned, color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder={lang === 'th' ? 'ค้นหารหัส, ชื่อพื้นที่...' : 'Search code, name...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {s === 'all' ? (lang === 'th' ? 'ทั้งหมด' : 'All') : s === 'active' ? (lang === 'th' ? 'ใช้งาน' : 'Active') : (lang === 'th' ? 'ปิดใช้' : 'Inactive')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>{lang === 'th' ? 'ชื่อพื้นที่' : 'Plant Name'}</Th>
              <Th>{lang === 'th' ? 'บริษัทที่สังกัด' : 'Company'}</Th>
              <Th>{lang === 'th' ? 'พิกัด' : 'Coordinates'}</Th>
              <Th>{lang === 'th' ? 'สถานะ' : 'Status'}</Th>
              <Th className="text-right">{lang === 'th' ? 'จัดการ' : 'Actions'}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                  {lang === 'th' ? 'ไม่พบข้อมูลพื้นที่' : 'No plants found'}
                </td>
              </tr>
            ) : filtered.map(plant => {
              const company = plantCompanyMap.get(plant.id)
              const isActive = plant.is_status === 'active'
              return (
                <tr key={plant.id} className="hover:bg-slate-50 transition-colors">
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                        <MapPin size={12} className="text-sky-600" />
                      </div>
                      <span className="font-mono font-bold text-slate-700 text-xs">{plant.code}</span>
                    </div>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-800 text-sm">{plant.name_th}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{plant.name_en}</p>
                  </Td>
                  <Td>
                    {company ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 size={11} className="text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{company.name_th}</p>
                          <p className="text-[10px] font-mono text-slate-400">{company.code}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {lang === 'th' ? 'ยังไม่สังกัด' : 'Unassigned'}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <p className="text-[11px] font-mono text-slate-500">
                      {Number(plant.latitude).toFixed(4)}, {Number(plant.longitude).toFixed(4)}
                    </p>
                  </Td>
                  <Td>
                    <Badge className={getStatusColor(plant.is_status)}>
                      {getStatusLabel(plant.is_status)}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => togglePlantStatus(plant.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      >
                        {isActive
                          ? <ToggleRight size={15} className="text-emerald-500" />
                          : <ToggleLeft size={15} className="text-slate-400" />}
                      </button>
                      <button
                        onClick={() => openModal('edit-plant', plant)}
                        className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => openModal('delete-plant', plant)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
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
          <div className="px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-400">
            {lang === 'th' ? `แสดง ${filtered.length} จาก ${plants.length} พื้นที่` : `Showing ${filtered.length} of ${plants.length} plants`}
          </div>
        )}
      </Card>

      <AddPlantModal />
      <EditPlantModal />
      <DeletePlantModal />
    </div>
  )
}
