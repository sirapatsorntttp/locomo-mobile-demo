'use client'
import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import { cn } from '@/lib/utils'
import type { Zone, Route, Point } from '@/types'
import {
  Plus, Search, ChevronDown, ChevronRight, MapPin,
  Pencil, Trash2, ToggleLeft, ToggleRight, X, Map,
  Navigation, Layers,
} from 'lucide-react'
import { useZoneStore } from '@/lib/stores/useZoneStore'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';

// ─── Direction badge ────────────────────────────────────────────────────────
function DirectionBadge({ dir }: { dir: string }) {
  const label = dir === 'inbound' ? 'เข้า' : dir === 'outbound' ? 'ออก' : '-'
  return (
    <span className={cn(
      'text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
      dir === 'inbound'
        ? 'bg-sky-50 text-sky-600 border-sky-200'
        : dir === 'outbound'
          ? 'bg-violet-50 text-violet-600 border-violet-200'
          : 'bg-slate-50 text-slate-400 border-slate-200'
    )}>
      {label}
    </span>
  )
}

// ─── Zone Form Modal ─────────────────────────────────────────────────────────
function ZoneModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: 'add' | 'edit'
  initial?: Partial<Zone>
  onClose: () => void
  onSave: (data: Partial<Zone>) => void
}) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [nameTh, setNameTh] = useState(initial?.name_th ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')

  const valid = code.trim() && nameTh.trim()

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">
            {mode === 'add' ? 'เพิ่มโซน' : 'แก้ไขโซน'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">รหัสโซน *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Z-01"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อโซน (ภาษาไทย) *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              value={nameTh}
              onChange={e => setNameTh(e.target.value)}
              placeholder="โซน A"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อโซน (อังกฤษ)</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              value={nameEn}
              onChange={e => setNameEn(e.target.value)}
              placeholder="Zone A"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => valid && onSave({ code: code.trim(), name_th: nameTh.trim(), name_en: nameEn.trim() })}
            disabled={!valid}
            className="px-4 py-2 text-sm font-semibold bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'add' ? 'เพิ่มโซน' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Route Modal (multi-select) ───────────────────────────────────────
function AssignRouteModal({
  zone,
  allRoutes,
  assignedRouteIds,
  onClose,
  onAssign,
}: {
  zone: Zone
  allRoutes: Route[]
  assignedRouteIds: Set<string>
  onClose: () => void
  onAssign: (route_ids: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const available = allRoutes.filter(r =>
    r.is_status === 'active' &&
    !assignedRouteIds.has(r.id) &&
    (r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name_th.includes(search) ||
      r.name_en.toLowerCase().includes(search.toLowerCase()))
  )

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected(prev =>
      prev.size === available.length
        ? new Set()
        : new Set(available.map(r => r.id))
    )

  const allChecked = available.length > 0 && selected.size === available.length
  const someChecked = selected.size > 0 && selected.size < available.length

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">เพิ่มเส้นทางในโซน</h2>
            <p className="text-xs text-slate-400">{zone.code} — {zone.name_th}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Search + select-all */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder="ค้นหาเส้นทาง..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {available.length > 0 && (
            <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allChecked}
                ref={el => { if (el) el.indeterminate = someChecked }}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 accent-sky-500"
              />
              <span className="text-xs text-slate-500">
                เลือกทั้งหมด ({available.length} เส้นทาง)
              </span>
              {selected.size > 0 && (
                <span className="ml-auto text-[10px] font-semibold bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">
                  เลือกแล้ว {selected.size}
                </span>
              )}
            </label>
          )}
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {available.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10">ไม่มีเส้นทางที่ว่าง</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {available.map(r => {
                const checked = selected.has(r.id)
                return (
                  <li key={r.id}>
                    <label
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none',
                        checked ? 'bg-sky-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(r.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-sky-500 flex-shrink-0"
                      />
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                        checked ? 'bg-sky-500' : 'bg-sky-100'
                      )}>
                        <Navigation size={12} className={checked ? 'text-white' : 'text-sky-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{r.name_th}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.code}</p>
                      </div>
                      <DirectionBadge dir={r.trip_direction} />
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400">
            {selected.size > 0
              ? `เลือก ${selected.size} เส้นทาง`
              : 'ยังไม่ได้เลือกเส้นทาง'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => selected.size > 0 && onAssign([...selected])}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm font-semibold bg-sky-500 text-white rounded-xl hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              เพิ่ม {selected.size > 0 ? `(${selected.size})` : ''} เส้นทาง
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Point row ────────────────────────────────────────────────────────────────
function PointRow({ point }: { point: Point }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-md group">
      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <MapPin size={9} className="text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-700">{point.name_th}</span>
        <span className="text-[10px] text-slate-400 font-mono ml-2">{point.code}</span>
      </div>
      {point.queue_default != null && (
        <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
          #{point.queue_default}
        </span>
      )}
    </div>
  )
}

// ─── Route row inside zone ───────────────────────────────────────────────────
function RouteRow({
  route,
  points,
  onRemove,
}: {
  route: Route
  points: Point[]
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const routePoints = points.filter(p => p.route_id === route.id)

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden mb-2">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <button
          className="flex-shrink-0 text-slate-400 hover:text-slate-600"
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
          <Navigation size={12} className="text-sky-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{route.name_th}</p>
          <p className="text-[10px] text-slate-400 font-mono">{route.code} · {routePoints.length} จุด</p>
        </div>
        <DirectionBadge dir={route.trip_direction} />
        <span className={cn(
          'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
          route.is_status === 'active'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-400'
        )}>
          {route.is_status === 'active' ? 'ใช้งาน' : 'ปิด'}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="text-slate-300 hover:text-red-500 transition-colors ml-1 flex-shrink-0"
          title="นำออกจากโซน"
        >
          <X size={13} />
        </button>
      </div>

      {open && routePoints.length > 0 && (
        <div className="bg-slate-50/50 px-4 py-2 border-t border-slate-100">
          <div className="space-y-0.5">
            {routePoints.map(pt => (
              <PointRow key={pt.id} point={pt} />
            ))}
          </div>
        </div>
      )}

      {open && routePoints.length === 0 && (
        <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">ยังไม่มีจุดจอด</p>
        </div>
      )}
    </div>
  )
}

// ─── Zone Card ────────────────────────────────────────────────────────────────
function ZoneCard({
  zone,
  allRoutes,
  points,
  assignedRouteIds,
  onEdit,
  onDelete,
  onToggle,
  onAssignRoute,
  onRemoveRoute,
}: {
  zone: Zone
  allRoutes: Route[]
  points: Point[]
  assignedRouteIds: Set<string>
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onAssignRoute: () => void
  onRemoveRoute: (route_id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const zoneRoutes = zone.routes ?? []

  return (
    <div className={cn(
      'bg-white border rounded-2xl overflow-hidden shadow-sm transition-all',
      zone.is_status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'
    )}>
      {/* Zone header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => setExpanded(o => !o)}
      >
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Layers size={15} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800">{zone.name_th}</p>
            {zone.name_en && (
              <span className="text-xs text-slate-400">{zone.name_en}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-400">{zone.code}</span>
            <span className="text-slate-200">·</span>
            <span className="text-[10px] text-slate-400">{zoneRoutes.length} เส้นทาง</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-[9px] font-bold px-2 py-0.5 rounded-full border',
            zone.is_status === 'active'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          )}>
            {zone.is_status === 'active' ? 'ใช้งาน' : 'ปิด'}
          </span>

          <button
            onClick={e => { e.stopPropagation(); onToggle() }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
            title="เปลี่ยนสถานะ"
          >
            {zone.is_status === 'active'
              ? <ToggleRight size={15} className="text-emerald-500" />
              : <ToggleLeft size={15} />}
          </button>

          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
            title="แก้ไข"
          >
            <Pencil size={13} />
          </button>

          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="ลบโซน"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded routes */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
          {zoneRoutes.length > 0 ? (
            <div className="space-y-1">
              {zoneRoutes.map(route => (
                <RouteRow
                  key={route.id}
                  route={route}
                  points={points}
                  onRemove={() => onRemoveRoute(route.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Map size={24} className="text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">ยังไม่มีเส้นทางในโซนนี้</p>
            </div>
          )}

          <button
            onClick={e => { e.stopPropagation(); onAssignRoute() }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-sky-200 rounded-xl text-xs text-sky-500 hover:bg-sky-50 hover:border-sky-300 transition-colors"
          >
            <Plus size={12} />
            เพิ่มเส้นทางในโซน
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ZonesPage() {
  const { routes, points, loadRoutesPoints } = useRoutePointStore()
  const { zones, loadZones, addZone, updateZone, deleteZone, toggleZoneStatus, assignRoutesToZone, removeRouteFromZone } = useZoneStore()
  const { lang } = useLang()

  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<
    | { type: 'add' }
    | { type: 'edit'; zone: Zone }
    | { type: 'delete'; zone: Zone }
    | { type: 'assign'; zone: Zone }
    | null
  >(null)

  useEffect(() => {
    loadZones()
    if (routes.length === 0) loadRoutesPoints()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return zones.filter(z =>
      !q ||
      z.code.toLowerCase().includes(q) ||
      z.name_th.includes(q) ||
      z.name_en.toLowerCase().includes(q)
    )
  }, [zones, search])

  // Set of route IDs already assigned to any zone
  const allAssignedRouteIds = useMemo(() => {
    const ids = new Set<string>()
    zones.forEach(z => z.routes?.forEach(r => ids.add(r.id)))
    return ids
  }, [zones])

  const stats = {
    total: zones.length,
    active: zones.filter(z => z.is_status === 'active').length,
    totalRoutes: zones.reduce((sum, z) => sum + (z.routes?.length ?? 0), 0),
    unassigned: routes.filter(r => !allAssignedRouteIds.has(r.id) && r.is_status === 'active').length,
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-800">
            {lang === 'th' ? 'โซน' : 'Zones'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'th' ? 'จัดการโซน · เส้นทาง · จุดจอด' : 'Manage zones · routes · stops'}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-xs font-semibold rounded-xl hover:bg-sky-600 transition-colors shadow-sm"
        >
          <Plus size={13} />
          {lang === 'th' ? 'เพิ่มโซน' : 'Add Zone'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-slate-50 bg-white flex-shrink-0">
        {[
          { label: 'โซนทั้งหมด', value: stats.total, color: 'text-slate-700' },
          { label: 'ใช้งาน', value: stats.active, color: 'text-emerald-600' },
          { label: 'เส้นทางในโซน', value: stats.totalRoutes, color: 'text-sky-600' },
          { label: 'เส้นทางว่าง', value: stats.unassigned, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0">
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50"
            placeholder="ค้นหาโซน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Zone list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Layers size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {search ? 'ไม่พบโซนที่ค้นหา' : 'ยังไม่มีโซน กด "เพิ่มโซน" เพื่อเริ่ม'}
            </p>
          </div>
        ) : (
          filtered.map(zone => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              allRoutes={routes}
              points={points}
              assignedRouteIds={allAssignedRouteIds}
              onEdit={() => setModal({ type: 'edit', zone })}
              onDelete={() => setModal({ type: 'delete', zone })}
              onToggle={() => toggleZoneStatus(zone.id)}
              onAssignRoute={() => setModal({ type: 'assign', zone })}
              onRemoveRoute={(route_id) => removeRouteFromZone(zone.id, route_id)}
            />
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <ZoneModal
          mode={modal.type}
          initial={modal.type === 'edit' ? modal.zone : undefined}
          onClose={() => setModal(null)}
          onSave={data => {
            if (modal.type === 'add') addZone(data).then(() => setModal(null))
            else updateZone(modal.zone.id, data).then(() => setModal(null))
          }}
        />
      )}

      {/* Delete confirm */}
      {modal?.type === 'delete' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-2">ยืนยันการลบโซน</h2>
            <p className="text-xs text-slate-500 mb-5">
              คุณต้องการลบโซน <span className="font-semibold text-slate-700">&quot;{modal.zone.name_th}&quot;</span> ใช่หรือไม่?
              เส้นทางใน zone นี้จะถูกถอดออกด้วย
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">ยกเลิก</button>
              <button
                onClick={() => deleteZone(modal.zone.id).then(() => setModal(null))}
                className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ลบโซน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign route modal */}
      {modal?.type === 'assign' && (
        <AssignRouteModal
          zone={modal.zone}
          allRoutes={routes}
          assignedRouteIds={allAssignedRouteIds}
          onClose={() => setModal(null)}
          onAssign={async (route_ids) => {
            await assignRoutesToZone(modal.zone.id, route_ids)
            setModal(null)
          }}
        />
      )}
    </div>
  )
}
