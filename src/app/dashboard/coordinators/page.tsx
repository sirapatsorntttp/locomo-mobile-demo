'use client'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import { Button } from '@/components/ui'
import {
  AddCoordinatorModal, EditCoordinatorModal, DeleteCoordinatorModal,
  AddCoordinatorTypeModal, EditCoordinatorTypeModal, DeleteCoordinatorTypeModal,
} from '@/components/modals/OtherModals'
import {
  Contact, Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  Tag, Building2, Phone, Mail, ChevronRight, Settings,
} from 'lucide-react'
import type { Coordinator, CoordinatorType } from '@/types'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useCoordinatorStore } from '@/lib/stores/useCoordinatorStore';

type Tab = 'coordinators' | 'types'

export default function CoordinatorsPage() {
  const { lang } = useLang()
  const { openModal } = useStore()
  const { coordinators, coordinatorTypes, loadCoordinators, toggleCoordinatorStatus } = useCoordinatorStore()
  const { loadCompanies, companies } = useCompanyStore()
  const [tab, setTab] = useState<Tab>('coordinators')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadCoordinators()
    loadCompanies()
  }, [loadCoordinators, loadCompanies])

  /* ── coordinator list filtered ── */
  const filteredCoordinators = useMemo(() => {
    return coordinators.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        c.name_th.toLowerCase().includes(q) ||
        c.name_en.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.tel ?? '').includes(q)
      const matchType = !filterType || c.coordinator_type_id === filterType
      const matchStatus = filterStatus === 'all' || c.is_status === filterStatus
      return matchSearch && matchType && matchStatus
    })
  }, [coordinators, search, filterType, filterStatus])

  /* ── type badge colour ── */
  const typeColors: Record<string, string> = {
    'ct-1': 'bg-blue-100 text-blue-700',
    'ct-2': 'bg-violet-100 text-violet-700',
    'ct-3': 'bg-emerald-100 text-emerald-700',
  }
  const getTypeColor = (id: string) =>
    typeColors[id] ?? 'bg-slate-100 text-slate-600'

  /* ── company name helper ── */
  const companyMap = useMemo(() =>
    Object.fromEntries(companies.map(c => [c.id, c])),
    [companies],
  )

  return (
    <div className="space-y-6">
      {/* Modals */}
      <AddCoordinatorModal />
      <EditCoordinatorModal />
      <DeleteCoordinatorModal />
      <AddCoordinatorTypeModal />
      <EditCoordinatorTypeModal />
      <DeleteCoordinatorTypeModal />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
            <Contact size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {lang === 'th' ? 'โคออร์ดิเนเตอร์' : 'Coordinators'}
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'th' ? 'จัดการประเภทและรายชื่อโคออร์ดิเนเตอร์' : 'Manage coordinator types and contacts'}
            </p>
          </div>
        </div>
        <Button
          variant="primary" size="sm"
          onClick={() => openModal(tab === 'types' ? 'add-coordinator-type' : 'add-coordinator')}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} />
          {tab === 'types'
            ? (lang === 'th' ? 'เพิ่มประเภท' : 'Add Type')
            : (lang === 'th' ? 'เพิ่มโคออร์ดิเนเตอร์' : 'Add Coordinator')}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: lang === 'th' ? 'ทั้งหมด' : 'Total', value: coordinators.length, color: 'text-slate-700' },
          { label: lang === 'th' ? 'ใช้งาน' : 'Active', value: coordinators.filter(c => c.is_status === 'active').length, color: 'text-emerald-600' },
          { label: lang === 'th' ? 'ประเภท' : 'Types', value: coordinatorTypes.length, color: 'text-violet-600' },
          { label: lang === 'th' ? 'มีบริษัทสังกัด' : 'With Company', value: coordinators.filter(c => c.company_id).length, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { id: 'coordinators', labelTh: 'รายชื่อโคออร์ดิเนเตอร์', labelEn: 'Coordinators' },
          { id: 'types', labelTh: 'ประเภท', labelEn: 'Types' },
        ] as { id: Tab; labelTh: string; labelEn: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.id
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {lang === 'th' ? t.labelTh : t.labelEn}
          </button>
        ))}
      </div>

      {/* ── TAB: Coordinators ── */}
      {tab === 'coordinators' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 p-4 border-b border-slate-100">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder={lang === 'th' ? 'ค้นหาชื่อ, อีเมล, เบอร์...' : 'Search name, email, tel...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white focus:outline-none"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="">{lang === 'th' ? 'ทุกประเภท' : 'All Types'}</option>
              {coordinatorTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name_th}</option>
              ))}
            </select>
            <select
              className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white focus:outline-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="all">{lang === 'th' ? 'ทุกสถานะ' : 'All Status'}</option>
              <option value="active">{lang === 'th' ? 'ใช้งาน' : 'Active'}</option>
              <option value="inactive">{lang === 'th' ? 'ปิดใช้งาน' : 'Inactive'}</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-left">
                  <th className="px-4 py-3 font-semibold">ชื่อ</th>
                  <th className="px-4 py-3 font-semibold">ประเภท</th>
                  <th className="px-4 py-3 font-semibold">บริษัทสังกัด</th>
                  <th className="px-4 py-3 font-semibold">ติดต่อ</th>
                  <th className="px-4 py-3 font-semibold">สถานะ</th>
                  <th className="px-4 py-3 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCoordinators.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      {lang === 'th' ? 'ไม่พบข้อมูล' : 'No data found'}
                    </td>
                  </tr>
                ) : filteredCoordinators.map(c => {
                  const ct = coordinatorTypes.find(t => t.id === c.coordinator_type_id)
                  const company = c.company_id ? (companyMap[c.company_id] ?? c.company) : null
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {c.name_th.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{c.name_th}</p>
                            <p className="text-[10px] text-slate-400">{c.name_en}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTypeColor(c.coordinator_type_id)}`}>
                          <Tag size={9} />
                          {ct?.name_th ?? c.coordinator_type_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {company ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 size={11} className="text-slate-400" />
                            <span className="text-slate-700">{company.name_th}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({company.code})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Locomo internal</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {c.tel && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Phone size={10} className="text-slate-400" />
                              <span>{c.tel}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Mail size={10} className="text-slate-400" />
                              <span>{c.email}</span>
                            </div>
                          )}
                          {!c.tel && !c.email && <span className="text-slate-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.is_status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                          }`}>
                          {c.is_status === 'active'
                            ? (lang === 'th' ? 'ใช้งาน' : 'Active')
                            : (lang === 'th' ? 'ปิด' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleCoordinatorStatus(c.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title={c.is_status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          >
                            {c.is_status === 'active'
                              ? <ToggleRight size={15} className="text-emerald-500" />
                              : <ToggleLeft size={15} />}
                          </button>
                          <button
                            onClick={() => openModal('edit-coordinator', c)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => openModal('delete-coordinator', c)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400">
            {filteredCoordinators.length} / {coordinators.length} {lang === 'th' ? 'รายการ' : 'records'}
          </div>
        </div>
      )}

      {/* ── TAB: Types ── */}
      {tab === 'types' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-left">
                  <th className="px-4 py-3 font-semibold">ชื่อไทย</th>
                  <th className="px-4 py-3 font-semibold">ชื่ออังกฤษ</th>
                  <th className="px-4 py-3 font-semibold">จำนวนโคออร์ดิเนเตอร์</th>
                  <th className="px-4 py-3 font-semibold">สถานะ</th>
                  <th className="px-4 py-3 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coordinatorTypes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      {lang === 'th' ? 'ยังไม่มีประเภท' : 'No types yet'}
                    </td>
                  </tr>
                ) : coordinatorTypes.map(ct => {
                  const count = coordinators.filter(c => c.coordinator_type_id === ct.id).length
                  return (
                    <tr key={ct.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${ct.is_status === 'active' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                          <span className="font-semibold text-slate-800">{ct.name_th}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{ct.name_en}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setTab('coordinators'); setFilterType(ct.id) }}
                          className="flex items-center gap-1 text-violet-600 hover:underline font-semibold"
                        >
                          {count} {lang === 'th' ? 'คน' : 'people'}
                          <ChevronRight size={11} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${ct.is_status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                          }`}>
                          {ct.is_status === 'active'
                            ? (lang === 'th' ? 'ใช้งาน' : 'Active')
                            : (lang === 'th' ? 'ปิด' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal('edit-coordinator-type', ct)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => openModal('delete-coordinator-type', ct)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            disabled={count > 0}
                            title={count > 0 ? 'มีโคออร์ดิเนเตอร์ผูกอยู่' : 'ลบประเภท'}
                          >
                            <Trash2 size={13} className={count > 0 ? 'opacity-30' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400">
            {coordinatorTypes.length} {lang === 'th' ? 'ประเภท' : 'types'}
          </div>
        </div>
      )}
    </div>
  )
}
