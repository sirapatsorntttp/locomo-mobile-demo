'use client'
import { useState } from 'react'
import { Bell, Plus, Search, Trash2, Clock, Calendar, Edit, CheckCircle } from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select, FormGrid, Textarea } from '@/components/ui/FormFields'
import { useLang } from '@/lib/lang-context'
import type { NotificationType, Status } from '@/types'

interface Notif {
  id: string; title: string; detail: string; type: NotificationType
  date_start: string; date_end: string; time_start: string; time_end: string
  is_status: Status; created_at: string
}

const typeVariants: Record<NotificationType, 'info' | 'success' | 'warning'> = {
  once: 'info', daily: 'success', daily_until: 'warning',
}

const initial: Notif[] = [
  { id: 'n1', title: 'แจ้งเตือนการจองรถ', detail: 'กรุณาจองรถล่วงหน้าอย่างน้อย 1 วันทำการ', type: 'daily', date_start: '2026-04-01', date_end: '2026-04-30', time_start: '07:00', time_end: '08:00', is_status: 'active', created_at: '2026-03-25T00:00:00Z' },
  { id: 'n2', title: 'วันหยุดสงกรานต์', detail: 'ระบบหยุดให้บริการวันที่ 13-15 เมษายน 2569', type: 'once', date_start: '2026-04-10', date_end: '2026-04-10', time_start: '08:00', time_end: '09:00', is_status: 'active', created_at: '2026-04-01T00:00:00Z' },
  { id: 'n3', title: 'เปลี่ยนเส้นทางชั่วคราว', detail: 'สาย A มีการปรับเปลี่ยนจุดจอดชั่วคราว กรุณาตรวจสอบ', type: 'daily_until', date_start: '2026-04-06', date_end: '2026-04-20', time_start: '06:30', time_end: '07:30', is_status: 'active', created_at: '2026-04-05T00:00:00Z' },
  { id: 'n4', title: 'ทดสอบระบบ', detail: 'การทดสอบระบบแจ้งเตือน', type: 'once', date_start: '2026-03-01', date_end: '2026-03-01', time_start: '09:00', time_end: '10:00', is_status: 'inactive', created_at: '2026-03-01T00:00:00Z' },
]

const empty = { title: '', detail: '', type: 'once' as NotificationType, date_start: new Date().toISOString().slice(0, 10), date_end: new Date().toISOString().slice(0, 10), time_start: '07:00', time_end: '08:00' }

export default function NotificationsPage() {
  const { addToast } = useStore()
  const { t } = useLang()
  const [notifs, setNotifs] = useState<Notif[]>(initial)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const typeLabels: Record<NotificationType, string> = {
    once: t('notifPage', 'typeOnce'),
    daily: t('notifPage', 'typeDaily'),
    daily_until: t('notifPage', 'typeDailyUntil'),
  }

  const filtered = notifs.filter(n =>
    (n.title.toLowerCase().includes(search.toLowerCase()) || n.detail.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === 'all' || n.type === typeFilter)
  )

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = t('organization','required')
    if (!form.date_start) e.date_start = t('organization','required')
    if (!form.date_end) e.date_end = t('organization','required')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleAdd = () => {
    if (!validate()) return
    const n: Notif = {
      id: `n${Date.now()}`, ...form,
      is_status: 'active', created_at: new Date().toISOString()
    }
    setNotifs(ns => [n, ...ns])
    addToast('success', `${t('notifPage','addNotif')} "${n.title}"`)
    setModalOpen(false)
    setForm({ ...empty })
  }

  const toggleStatus = (id: string) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_status: n.is_status === 'active' ? 'inactive' : 'active' } : n))
    addToast('info', t('notifPage', 'changeStatus'))
  }

  const deleteNotif = (id: string) => {
    const n = notifs.find(x => x.id === id)
    setNotifs(ns => ns.filter(x => x.id !== id))
    addToast('success', `${t('common','delete')} "${n?.title}"`)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('notifPage', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('notifPage', 'subtitle')}</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setModalOpen(true)}>
          {t('notifPage', 'addNotif')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('common','all'), value: notifs.length, c: 'bg-slate-50 border-slate-200', t: 'text-slate-700' },
          { label: t('notifPage','activeCount'), value: notifs.filter(n => n.is_status === 'active').length, c: 'bg-emerald-50 border-emerald-100', t: 'text-emerald-700' },
          { label: t('notifPage','onceType'), value: notifs.filter(n => n.type === 'once').length, c: 'bg-blue-50 border-blue-100', t: 'text-blue-700' },
          { label: t('notifPage','dailyType'), value: notifs.filter(n => n.type !== 'once').length, c: 'bg-amber-50 border-amber-100', t: 'text-amber-700' },
        ].map(i => (
          <div key={i.label} className={`rounded-xl p-4 border ${i.c}`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{i.label}</p>
            <p className={`text-2xl font-bold ${i.t}`}>{i.value}</p>
          </div>
        ))}
      </div>

      {/* Active cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {notifs.filter(n => n.is_status === 'active').map(n => (
          <div key={n.id} className="bg-white rounded-xl border border-slate-100 shadow-card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Bell size={16} className="text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{n.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={typeVariants[n.type]}>{typeLabels[n.type]}</Badge>
            </div>
            <div className="space-y-1 text-xs text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar size={11} className="text-slate-400" />
                <span>{n.date_start} → {n.date_end}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={11} className="text-slate-400" />
                <span>{n.time_start} – {n.time_end} {t('common','timeUnit')}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => toggleStatus(n.id)}
                className="flex-1 text-xs text-amber-600 hover:bg-amber-50 rounded-lg py-1.5 transition-colors font-semibold">{t('notifPage','deactivate')}</button>
              <button onClick={() => deleteNotif(n.id)}
                className="flex-1 text-xs text-red-500 hover:bg-red-50 rounded-lg py-1.5 transition-colors font-semibold flex items-center justify-center gap-1">
                <Trash2 size={11} />{t('common','delete')}
              </button>
            </div>
          </div>
        ))}

        <button onClick={() => setModalOpen(true)}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-sky-300 hover:text-sky-400 transition-all group">
          <div className="w-12 h-12 rounded-xl border-2 border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus size={20} />
          </div>
          <p className="text-sm font-semibold">{t('notifPage','addNotif')}</p>
        </button>
      </div>

      {/* Table */}
      <Card padding="sm">
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-48">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full"
              placeholder={t('notifPage','searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'once', 'daily', 'daily_until'] as const).map(f => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${typeFilter === f ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>
                {f === 'all' ? t('common','all') : f}
              </button>
            ))}
          </div>
        </div>
        <Table>
          <thead><tr>
            <Th>{t('notifPage','subjectLabel')}</Th>
            <Th>{t('notifPage','typeLabel')}</Th>
            <Th>{t('notifPage','dateLabel')}</Th>
            <Th>{t('notifPage','timeLabel')}</Th>
            <Th>{t('common','status')}</Th>
            <Th>{t('common','actions')}</Th>
          </tr></thead>
          <tbody>
            {filtered.map(n => (
              <tr key={n.id} className="table-row-hover transition-colors">
                <Td>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{n.title}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{n.detail}</p>
                  </div>
                </Td>
                <Td><Badge variant={typeVariants[n.type]}>{typeLabels[n.type]}</Badge></Td>
                <Td><span className="text-xs font-mono text-slate-600">{n.date_start} → {n.date_end}</span></Td>
                <Td><span className="text-xs font-mono text-slate-500">{n.time_start}–{n.time_end}</span></Td>
                <Td>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(n.is_status)}`}>
                    {getStatusLabel(n.is_status)}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => toggleStatus(n.id)}
                      className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title={t('notifPage','changeStatus')}>
                      <CheckCircle size={13} />
                    </button>
                    <button onClick={() => deleteNotif(n.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="text-center py-8 text-xs text-slate-400">{t('common','noData')}</td></tr>}
          </tbody>
        </Table>
      </Card>

      {/* Add modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('notifPage','addNotif')} subtitle="notifications table" size="md"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>{t('common','cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleAdd}>{t('notifPage','formTitle')}</Button>
        </>}>
        <div className="space-y-4">
          <Field label={t('notifPage','titleField')} required error={errors.title}>
            <Input placeholder={t('notifPage','titlePlaceholder')} value={form.title} onChange={e => s('title', e.target.value)} error={!!errors.title} />
          </Field>
          <Field label={t('notifPage','detailField')}>
            <Textarea placeholder={t('notifPage','detailPlaceholder')} value={form.detail} onChange={e => s('detail', e.target.value)} />
          </Field>
          <Field label={t('notifPage','typeField')}>
            <Select value={form.type} onChange={e => s('type', e.target.value)}>
              <option value="once">once · {t('notifPage','typeOnce')}</option>
              <option value="daily">daily · {t('notifPage','typeDaily')}</option>
              <option value="daily_until">daily_until · {t('notifPage','typeDailyUntil')}</option>
            </Select>
          </Field>
          <FormGrid>
            <Field label={t('notifPage','startDate')} required error={errors.date_start}>
              <Input type="date" value={form.date_start} onChange={e => s('date_start', e.target.value)} error={!!errors.date_start} />
            </Field>
            <Field label={t('notifPage','endDate')} required error={errors.date_end}>
              <Input type="date" value={form.date_end} onChange={e => s('date_end', e.target.value)} error={!!errors.date_end} />
            </Field>
            <Field label={t('notifPage','startTime')}>
              <Input type="time" value={form.time_start} onChange={e => s('time_start', e.target.value)} />
            </Field>
            <Field label={t('notifPage','endTime')}>
              <Input type="time" value={form.time_end} onChange={e => s('time_end', e.target.value)} />
            </Field>
          </FormGrid>
        </div>
      </Modal>
    </div>
  )
}
