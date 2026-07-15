'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  Layers, Plus, Pencil, Trash2, Search,
  Bus, Map, Clock, UserCheck, Building2, ArrowRight,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { Post } from '@/types'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import { usePostStore } from '@/lib/stores/post.store'

export default function PostsPage() {
  const {
   openModal, 
  } = useStore()
  const { posts, deletePost, updatePost, loadPost } = usePostStore()
  const { driverVehicleVendors } = useDriverStore()
  const { shifts } = useShiftStore()
  const { routes } = useRoutePointStore()
  const { t } = useLang()

  const [search, setSearch] = useState('')
  const [shiftFilter, setShift] = useState('')
  const [routeFilter, setRoute] = useState('')
  const [statusFilter, setStatus] = useState<'all' | 'active' | 'inactive'>('active')
  
  useEffect(() => {
    loadPost()
  }, [])

  const filtered = useMemo(() => posts.filter(p => {
    const q = `${p.code} ${p.route?.name_th ?? ''} ${p.shift?.name_th ?? ''} ${p.driver_vehicle_vendor?.driver_vehicle?.driver?.first_name_th ?? ''}`.toLowerCase()
    if (!q.includes(search.toLowerCase())) return false
    if (shiftFilter && p.shift_id !== shiftFilter) return false
    if (routeFilter && p.route_id !== routeFilter) return false
    if (statusFilter !== 'all' && p.is_status !== statusFilter) return false
    return true
  }), [loadPost, posts, search, shiftFilter, routeFilter, statusFilter])

  const stats = {
    total: posts.length,
    active: posts.filter(p => p.is_status === 'active').length,
    inactive: posts.filter(p => p.is_status === 'inactive').length,
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('posts', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('posts', 'subtitle')}</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-post')}>
          {t('posts', 'addPost')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('posts', 'allPosts'), value: stats.total, color: 'bg-white border-slate-200', text: 'text-slate-700', icon: <Layers size={16} className="text-slate-400" /> },
          { label: t('posts', 'active'), value: stats.active, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={16} className="text-emerald-400" /> },
          { label: t('posts', 'inactive'), value: stats.inactive, color: 'bg-slate-50 border-slate-200', text: 'text-slate-500', icon: <XCircle size={16} className="text-slate-300" /> },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border flex items-center gap-3 ${s.color}`}>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-48">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
            placeholder={t('posts', 'searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          value={shiftFilter}
          onChange={e => setShift(e.target.value)}
        >
          <option value="">{t('posts', 'allShifts')}</option>
          {shifts.map(s => <option key={s.id} value={s.id}>{s.name_th}</option>)}
        </select>
        <select
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          value={routeFilter}
          onChange={e => setRoute(e.target.value)}
        >
          <option value="">{t('posts', 'allRoutes')}</option>
          {routes.map(r => <option key={r.id} value={r.id}>{r.name_th}</option>)}
        </select>
        <select
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          value={statusFilter}
          onChange={e => setStatus(e.target.value as typeof statusFilter)}
        >
          <option value="all">{t('posts', 'allStatuses')}</option>
          <option value="active">{t('common', 'active')}</option>
          <option value="inactive">{t('common', 'inactive')}</option>
        </select>
      </div>

      {/* Board view */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Layers size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t('posts', 'notFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={() => openModal('edit-post', post)}
              onDelete={() => openModal('delete-post', post)}
              onToggle={() => updatePost(post.id, { is_status: post.is_status === 'active' ? 'inactive' : 'active' })}
            />
          ))}
        </div>
      )}

      {/* Table */}
      <Card padding="sm">
        <h2 className="text-sm font-bold text-slate-800 mb-4">{t('common', 'totalItems')} ({posts.length})</h2>
        <Table>
          <thead>
            <tr>
              <Th>{t('posts', 'codeLabel')}</Th>
              <Th>{t('common', 'route')}</Th>
              <Th>{t('common', 'shift')}</Th>
              <Th>{t('common', 'driver')}</Th>
              <Th>{t('common', 'vehicle')}</Th>
              <Th>Vendor</Th>
              <Th>{t('common', 'status')}</Th>
              <Th>{t('common', 'actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => {
              const dv = p.driver_vehicle_vendor?.driver_vehicle
              const driver = dv?.driver
              const vehicle = dv?.vehicle
              const vendor = p.driver_vehicle_vendor?.vendor
              return (
                <tr key={p.id} className="table-row-hover transition-colors">
                  <Td>
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Map size={11} className="text-sky-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700">{p.route?.name_th ?? '-'}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-violet-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700">{p.shift?.name_th ?? '-'}</span>
                    </div>
                  </Td>
                  <Td>
                    {driver ? (
                      <div className="flex items-center gap-1">
                        <UserCheck size={11} className="text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-slate-700">{driver.first_name_th} {driver.last_name_th}</span>
                      </div>
                    ) : <span className="text-[10px] text-amber-500">{t('posts', 'unspecified')}</span>}
                  </Td>
                  <Td>
                    {vehicle ? (
                      <span className="text-xs font-mono font-bold text-slate-700">{vehicle.license}</span>
                    ) : <span className="text-[10px] text-slate-300">-</span>}
                  </Td>
                  <Td>
                    {vendor ? (
                      <div className="flex items-center gap-1">
                        <Building2 size={11} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-xs text-slate-700">{vendor.name_th}</span>
                      </div>
                    ) : <span className="text-[10px] text-slate-300">-</span>}
                  </Td>
                  <Td>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(p.is_status)}`}>
                      {getStatusLabel(p.is_status)}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openModal('edit-post', p)} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => openModal('delete-post', p)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────
function PostCard({ post, onEdit, onDelete, onToggle }: {
  post: Post
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const { t } = useLang()
  const dv = post.driver_vehicle_vendor?.driver_vehicle
  const driver = dv?.driver
  const vehicle = dv?.vehicle
  const vendor = post.driver_vehicle_vendor?.vendor
  const isActive = post.is_status === 'active'

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Layers size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 font-mono">{post.code}</p>
            <p className="text-[10px] text-slate-400">Post ID: {post.id}</p>
          </div>
        </div>
        <Badge variant={isActive ? 'success' : 'gray'}>{getStatusLabel(post.is_status)}</Badge>
      </div>

      {/* Chain: Route → Shift */}
      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center">
            <Map size={11} className="text-sky-600" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase">{t('common', 'route')}</p>
            <p className="text-xs font-semibold text-slate-700">{post.route?.name_th ?? '-'}</p>
          </div>
        </div>
        <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
            <Clock size={11} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase">{t('common', 'shift')}</p>
            <p className="text-xs font-semibold text-slate-700">{post.shift?.name_th ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* Driver → Vehicle → Vendor chain */}
      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
        <div className="flex items-center gap-1.5 flex-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <UserCheck size={11} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase">{t('common', 'driver')}</p>
            <p className="text-xs font-semibold text-slate-700">
              {driver ? `${driver.first_name_th} ${driver.last_name_th}` : <span className="text-amber-500">-</span>}
            </p>
          </div>
        </div>
        <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />
        <div className="flex items-center gap-1.5 flex-1">
          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Bus size={11} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase">{t('common', 'vehicle')}</p>
            <p className="text-xs font-semibold font-mono text-slate-700">{vehicle?.license ?? '-'}</p>
          </div>
        </div>
        <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />
        <div className="flex items-center gap-1.5 flex-1">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={11} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase">Vendor</p>
            <p className="text-xs font-semibold text-slate-700">{vendor?.name_th ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-amber-600 hover:bg-amber-50 py-1.5 rounded-lg transition-colors"
        >
          <Pencil size={11} /> {t('common', 'edit')}
        </button>
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-sky-600 hover:bg-sky-50 py-1.5 rounded-lg transition-colors"
        >
          {isActive ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
          {isActive ? t('common', 'disable') : t('common', 'enable')}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
