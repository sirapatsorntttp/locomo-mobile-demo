'use client'
import { useEffect, useState, useMemo } from 'react'
import { Plus, Edit, Trash2, Sun, Moon, Layers, Building2 } from 'lucide-react'
import { Card, Button, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel, getShiftTypeLabel, getShiftScheduleLabel, getShiftScheduleColor } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { isSuperAdmin, getCompanyPlantId, getProfile } from '@/lib/auth-token'
import type { Shift, ShiftGroup } from '@/types'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useShiftGroupStore } from '@/lib/stores/shiftGroup.store'
import { useShiftStore } from '@/lib/stores/shift.store'
import { usePostStore } from '@/lib/stores/post.store'

export default function ShiftsPage() {
  const { openModal } = useStore()
  const {posts} = usePostStore()
  const { shifts, loadShifts } = useShiftStore()
  const { shiftGroups, loadShiftGroups, deleteShiftGroup } = useShiftGroupStore()
  const { t } = useLang()
  const { companies, companyPlants, } = useCompanyStore()
  const [selectedPcId, setSelectedPcId] = useState('')
  const [userIsSA, setUserIsSA] = useState(false)


  useEffect(() => {
    const sa = isSuperAdmin()
    const profile = getProfile()
    setUserIsSA(sa)
    if (!sa) {
      const cpId = getCompanyPlantId() ?? ''
      setSelectedPcId(cpId)
      loadShiftGroups(cpId)
      loadShifts(cpId)
    } else {
      loadShiftGroups()
      loadShifts()
    }
  }, [])

  useEffect(() => {
    if (!userIsSA || !selectedPcId) return
    loadShiftGroups(selectedPcId || undefined)
    loadShifts(selectedPcId || undefined)
  }, [selectedPcId, userIsSA])

  const pcList = useMemo(() => {
    if (!userIsSA) return []
    return companyPlants.map(cp => {
      const company = companies.find(c => c.id === cp.company_id)
      return { id: cp.id, label: company ? `${company.name_th} (${company.code})` : cp.id }
    })
  }, [userIsSA, companyPlants, companies])

  const selectedLabel = useMemo(() => {
    if (userIsSA) {
      if (!selectedPcId) return 'ทุกบริษัท'
      return pcList.find(p => p.id === selectedPcId)?.label ?? selectedPcId
    }
    const cp = companyPlants.find(c => c.id === selectedPcId)
    const company = cp ? companies.find(c => c.id === cp.company_id) : null
    return company ? `${company.name_th} (${company.code})` : selectedPcId
  }, [userIsSA, selectedPcId, pcList, companyPlants, companies])

  const ungroupedShifts = shifts.filter(s => !s.shift_group_id)

  const openAddShiftGroup = () => openModal('add-shift-group', { company_plant_id: selectedPcId || null })
  const openAddShift = () => openModal('add-shift', { company_plant_id: selectedPcId || null })

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('shifts', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('shifts', 'subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Layers size={13} />} onClick={openAddShiftGroup}>
            เพิ่มกลุ่มกะ
          </Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openAddShift}>
            {t('shifts', 'addShift')}
          </Button>
        </div>
      </div>

      {/* ── PC Selector (SA only) ──────────────────────────── */}
      {userIsSA && (
        <Card padding="sm">
          <div className="flex items-center gap-3 px-4 py-3">
            <Building2 size={15} className="text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-600 shrink-0">บริษัท:</span>
            <select
              value={selectedPcId}
              onChange={e => setSelectedPcId(e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">ทุกบริษัท</option>
              {pcList.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400 shrink-0">
              {shiftGroups.length} กลุ่ม · {shifts.length} กะ
            </span>
          </div>
        </Card>
      )}

      {/* ── Company context badge (non-SA) ────────────────── */}
      {!userIsSA && selectedPcId && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5">
          <Building2 size={13} className="text-sky-400" />
          <span>กะและกลุ่มกะของ <span className="font-semibold text-sky-700">{selectedLabel}</span></span>
        </div>
      )}

      {/* ── Shift Groups Management ──────────────────────────── */}
      <Card padding="sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">กลุ่มกะ</h2>
            <p className="text-xs text-slate-400">จัดการกลุ่มกะ — กะจะถูกผูกกับกลุ่ม</p>
          </div>
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={openAddShiftGroup}>
            เพิ่มกลุ่มกะ
          </Button>
        </div>
        {shiftGroups.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Layers size={28} className="mx-auto mb-2 text-slate-200" />
            <p className="text-xs">ยังไม่มีกลุ่มกะ</p>
            <button onClick={openAddShiftGroup} className="text-xs text-sky-500 hover:underline mt-1">+ เพิ่มกลุ่มกะแรก</button>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>รหัส</Th>
                <Th>ชื่อ (TH)</Th>
                <Th>ชื่อ (EN)</Th>
                <Th>กะในกลุ่ม</Th>
                <Th>สถานะ</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {shiftGroups.map(group => {
                const count = shifts.filter(s => s.shift_group_id === group.id).length
                return (
                  <tr key={group.id} className="table-row-hover transition-colors">
                    <Td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{group.code}</span></Td>
                    <Td><span className="text-xs font-semibold text-slate-700">{group.name_th}</span></Td>
                    <Td><span className="text-xs text-slate-500">{group.name_en}</span></Td>
                    <Td><span className="text-xs text-slate-600">{count} กะ</span></Td>
                    <Td>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(group.is_status)}`}>
                        {getStatusLabel(group.is_status)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openModal('edit-shift-group', group)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`ลบกลุ่มกะ "${group.name_th}"?`)) deleteShiftGroup(group.id) }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ── Shifts by Group ──────────────────────────────────── */}
      {shiftGroups.length > 0 && (
        <div className="space-y-4">
          {shiftGroups.map(group => {
            const groupShifts = shifts.filter(s => s.shift_group_id === group.id)
            return (
              <Card key={group.id} padding="md">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{group.name_th}</p>
                    <p className="text-[10px] font-mono text-slate-400">{group.code}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(group.is_status)}`}>
                    {getStatusLabel(group.is_status)}
                  </span>
                </div>

                {groupShifts.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                    ยังไม่มีกะในกลุ่มนี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {groupShifts.map(shift => (
                      <ShiftCard key={shift.id} shift={shift} openModal={openModal} posts={posts} t={t} />
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Ungrouped shifts ─────────────────────────────────── */}
      {ungroupedShifts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-3">กะที่ไม่มีกลุ่ม</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ungroupedShifts.map(shift => (
              <ShiftCard key={shift.id} shift={shift} openModal={openModal} posts={posts} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────── */}
      {shifts.length === 0 && shiftGroups.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">ยังไม่มีข้อมูลกะ</p>
        </div>
      )}
    </div>
  )
}

function ShiftCard({ shift, openModal, posts, t }: {
  shift: Shift
  openModal: (type: any, data?: any) => void
  posts: any[]
  t: ReturnType<typeof useLang>['t']
}) {
  const shiftPosts = posts.filter(p => p.shift_id === shift.id)

  return (
    <div className="bg-slate-50 rounded-xl p-3 group relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${shift.schedule === 'day' ? 'bg-amber-100' : 'bg-indigo-100'}`}>
            {shift.schedule === 'day'
              ? <Sun size={15} className="text-amber-600" />
              : <Moon size={15} className="text-indigo-600" />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-xs">{shift.name_th}</p>
            <p className="text-[10px] font-mono text-slate-400">{shift.code}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
        <div className="bg-white rounded-lg p-2">
          <p className="text-slate-400 text-[10px] mb-0.5">{t('shifts', 'typeLabel')}</p>
          <p className="font-semibold text-slate-700">{getShiftTypeLabel(shift.type)}</p>
        </div>
        <div className="bg-white rounded-lg p-2">
          <p className="text-slate-400 text-[10px] mb-0.5">{t('shifts', 'shiftLabel')}</p>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getShiftScheduleColor(shift.schedule)}`}>
            {getShiftScheduleLabel(shift.schedule)}
          </span>
        </div>
        <div className="bg-white rounded-lg p-2 col-span-2">
          <p className="text-slate-400 text-[10px] mb-0.5">{t('shifts', 'timeLabel')}</p>
          <p className="font-mono font-bold text-slate-800 text-sm">{shift.default_time}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{shiftPosts.length} {t('shifts', 'linkedPosts')}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openModal('edit-shift', shift)} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
            <Edit size={12} />
          </button>
          <button onClick={() => openModal('delete-shift', shift)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
