'use client'
import { useEffect, useState } from 'react'
import {
  ShieldCheck, Plus, Search, Eye, Pencil, Trash2,
  Clock, CheckCircle2, XCircle, ChevronRight, RefreshCw,
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusLabel, getStatusColor, getAllowDaysLabel, getAfterCutoffLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { BookingPolicy } from '@/types'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useBookingStore } from '@/lib/stores/booking.store'

function RuleChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${on ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}>
      {on ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
      {label}
    </span>
  )
}

export default function BookingPoliciesPage() {
  const { openModal } = useStore()
  const { bookingPolicies, bookingPoliciesTotal, loadBookingPolicies, deleteBookingPolicy, updateBookingPolicy } = useBookingStore()
  const { loadCompanies } = useCompanyStore()
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([loadBookingPolicies(), loadCompanies()]).finally(() => setLoading(false))
  }, [])

  const filtered = bookingPolicies.filter(p => {
    const q = `${p.name_th} ${p.name_en} ${p.companys?.name_th ?? ''}`.toLowerCase()
    return q.includes(search.toLowerCase()) && (statusFilter === 'all' || p.is_status === statusFilter)
  })

  const counts = {
    total: bookingPolicies.length,
    active: bookingPolicies.filter(p => p.is_status === 'active').length,
    approval: bookingPolicies.filter(p => p.booking_policy_rules?.requires_approval).length,
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('bookingPolicies', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('bookingPolicies', 'subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); loadBookingPolicies().finally(() => setLoading(false)) }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-booking-policy')}>
            {t('bookingPolicies', 'createNew')}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'นโยบายทั้งหมด', value: counts.total, color: 'bg-slate-50 border-slate-200', text: 'text-slate-700', icon: <ShieldCheck size={16} className="text-slate-400" /> },
          { label: 'ใช้งานอยู่', value: counts.active, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={16} className="text-emerald-400" /> },
          { label: 'ต้องการอนุมัติ', value: counts.approval, color: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: <Clock size={16} className="text-amber-400" /> },
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
            placeholder="ค้นหานโยบาย..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">ทุกสถานะ</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ปิดใช้งาน</option>
        </select>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">ไม่พบนโยบาย</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(policy => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onEdit={() => openModal('edit-booking-policy', policy)}
              onDelete={() => openModal('delete-booking-policy', policy)}
              onToggle={() => updateBookingPolicy(policy.id, { status: policy.is_status === 'active' ? 'inactive' : 'active' })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PolicyCard({
  policy, onEdit, onDelete, onToggle,
}: {
  policy: BookingPolicy
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const r = policy.booking_policy_rules

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${policy.is_status === 'inactive' ? 'opacity-60 bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">{policy.name_th}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{policy.name_en}</p>
          </div>
        </div>
        <Badge variant={policy.is_status === 'active' ? 'success' : 'gray'}>
          {getStatusLabel(policy.is_status)}
        </Badge>
      </div>

      {/* Company */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <ChevronRight size={11} className="text-slate-300" />
        <span className="font-semibold text-slate-700">{policy.companys?.name_th ?? '—'}</span>
        {policy.companys?.code && (
          <>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-[10px] text-slate-400">{policy.companys.code}</span>
          </>
        )}
      </div>

      {/* Route / org scope */}
      <div className="flex flex-wrap gap-1.5">
        {policy.booking_policy_routes && policy.booking_policy_routes.length > 0 ? (
          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">
            {policy.booking_policy_routes.length} เส้นทาง
          </span>
        ) : (
          <span className="text-[10px] bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full">ทุกเส้นทาง</span>
        )}
        {policy.booking_policy_org_units && policy.booking_policy_org_units.length > 0 ? (
          <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">
            {policy.booking_policy_org_units.length} หน่วยงาน
          </span>
        ) : (
          <span className="text-[10px] bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full">ทุกหน่วยงาน</span>
        )}
      </div>

      {/* Rules grid */}
      {r && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-slate-400">โหมดการจอง</span>
          <span className="font-semibold text-slate-700">
            {r.booking_mode === 'self_select' ? 'เลือกเอง' : 'กำหนดโดยระบบ'}
          </span>
          <span className="text-slate-400">วันที่อนุญาต</span>
          <span className="font-semibold text-slate-700">{getAllowDaysLabel(r.allow_days)}</span>
          <span className="text-slate-400">เวลาตัดรอบ</span>
          <span className="font-semibold text-slate-700">{r.cutoff_time} น.</span>
          <span className="text-slate-400">หลังตัดรอบ</span>
          <span className={`font-semibold ${r.after_cutoff_action === 'block' ? 'text-red-600' : 'text-amber-600'}`}>
            {getAfterCutoffLabel(r.after_cutoff_action)}
          </span>
          <span className="text-slate-400">ล่วงหน้า</span>
          <span className="font-semibold text-slate-700">
            {r.advance_days_min}–{r.advance_days_max ?? '∞'} วัน
          </span>
          {r.max_per_day && (
            <>
              <span className="text-slate-400">สูงสุด/วัน</span>
              <span className="font-semibold text-slate-700">{r.max_per_day} ครั้ง</span>
            </>
          )}
        </div>
      )}

      {/* Approval chips */}
      {r && (
        <div className="flex flex-wrap gap-1.5">
          <RuleChip on={r.requires_approval} label="ต้องอนุมัติ" />
          <RuleChip on={r.ot_requires_approval} label="OT ต้องอนุมัติ" />
          <RuleChip on={r.holiday_requires_approval} label="วันหยุดต้องอนุมัติ" />
          <RuleChip on={r.allow_employee_edit} label="แก้ไขได้" />
          <RuleChip on={r.allow_employee_cancel} label="ยกเลิกได้" />
          <RuleChip on={r.allow_recurring} label="จองซ้ำ" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-amber-600 hover:bg-amber-50 py-1.5 rounded-lg transition-colors"
        >
          <Pencil size={11} /> แก้ไข
        </button>
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 py-1.5 rounded-lg transition-colors"
        >
          {policy.is_status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
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
