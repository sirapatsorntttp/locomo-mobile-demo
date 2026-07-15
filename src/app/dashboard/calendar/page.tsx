'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Sun, Umbrella, Trash2, Edit2, X, ChevronLeft, ChevronRight,
  CalendarDays, Check,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import { getProfile, isSuperAdmin, getCompanyPlantId } from '@/lib/auth-token'
import type { CalendarGroup } from '@/types'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useCalendarStore } from '@/lib/stores/useCalendarStore';

const MONTH_NAMES_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const DAY_HEADERS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#0ea5e9']

function pad(n: number) { return String(n).padStart(2, '0') }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstDow(y: number, m: number) { return new Date(y, m, 1).getDay() }
function ds(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }

// ─── Add Calendar Group Modal ─────────────────────────────────
function AddGroupModal({
  pcId, onClose, onSave,
}: { pcId: string; onClose: () => void; onSave: (name: string, color: string, desc: string) => void }) {
  const { t } = useLang()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [desc, setDesc] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[380px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-slate-800">{t('calendar', 'createNew')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X size={15} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('calendar', 'calNameLabel')}</label>
            <input
              autoFocus
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder={t('calendar', 'calNamePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('calendar', 'descLabel')}</label>
            <input
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400"
              placeholder={t('calendar', 'descPlaceholder')}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">{t('calendar', 'colorLabel')}</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: c, border: color === c ? '3px solid #1e293b' : '2px solid transparent' }}
                >
                  {color === c && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 text-sm text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 transition-colors font-semibold">{t('common', 'cancel')}</button>
            <button
              onClick={() => { if (name.trim()) { onSave(name.trim(), color, desc.trim()); onClose() } }}
              disabled={!name.trim()}
              className="flex-1 text-sm text-white rounded-xl py-2.5 font-bold transition-colors disabled:opacity-50"
              style={{ background: name.trim() ? color : '#94a3b8' }}
            >
              {t('calendar', 'createBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Group Modal ─────────────────────────────────────────
function EditGroupModal({
  group, onClose, onSave,
}: { group: CalendarGroup; onClose: () => void; onSave: (id: string, name: string, color: string, desc: string) => void }) {
  const { t } = useLang()
  const [name, setName] = useState(group.name)
  const [color, setColor] = useState(group.color)
  const [desc, setDesc] = useState(group.description ?? '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[380px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-slate-800">{t('calendar', 'editCal')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X size={15} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t('calendar', 'calNameLabel')}</label>
            <input autoFocus className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-sky-400" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t('calendar', 'descLabel')}</label>
            <input className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">{t('calendar', 'colorLabel')}</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: c, border: color === c ? '3px solid #1e293b' : '2px solid transparent' }}>
                  {color === c && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 text-sm text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 font-semibold">{t('common', 'cancel')}</button>
            <button onClick={() => { if (name.trim()) { onSave(group.id, name.trim(), color, desc.trim()); onClose() } }} disabled={!name.trim()} className="flex-1 text-sm text-white rounded-xl py-2.5 font-bold" style={{ background: name.trim() ? color : '#94a3b8' }}>{t('common', 'save')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add Day Modal ────────────────────────────────────────────
function AddDayModal({
  initDate, group, onClose, onSave,
}: { initDate: string; group: CalendarGroup; onClose: () => void; onSave: (date: string, type: 'holiday' | 'weekday', name: string) => void }) {
  const { t } = useLang()
  const [date, setDate] = useState(initDate)
  const [type, setType] = useState<'holiday' | 'weekday'>('holiday')
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: group.color + '22', border: `1.5px solid ${group.color}` }}>
            <CalendarDays size={14} style={{ color: group.color }} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-800">{t('calendar', 'addDay')}</h2>
            <p className="text-[10px] text-slate-400">{group.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X size={15} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t('common', 'date')}</label>
            <input type="date" className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-sky-400 font-mono" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t('calendar', 'dayTypeLabel')}</label>
            <div className="mt-1 flex gap-2">
              {(['holiday', 'weekday'] as const).map(tp => (
                <button
                  key={tp}
                  onClick={() => setType(tp)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border transition-all ${type === tp
                    ? tp === 'holiday' ? 'bg-rose-50 text-rose-600 border-rose-300' : 'bg-emerald-50 text-emerald-600 border-emerald-300'
                    : 'text-slate-400 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {tp === 'holiday' ? <Umbrella size={13} /> : <Sun size={13} />}
                  {tp === 'holiday' ? t('calendar', 'dayHoliday') : t('calendar', 'dayWork')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t('calendar', 'dayNameLabel')}</label>
            <input className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-sky-400" placeholder={t('calendar', 'dayNamePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 text-sm text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 font-semibold">{t('common', 'cancel')}</button>
            <button
              onClick={() => { if (date && name.trim()) { onSave(date, type, name.trim()); onClose() } }}
              disabled={!date || !name.trim()}
              className="flex-1 text-sm text-white rounded-xl py-2.5 font-bold disabled:opacity-50"
              style={{ background: group.color }}
            >
              {t('calendar', 'addDayBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Month Calendar Grid ──────────────────────────────────────
function MonthGrid({
  year, month, entries, color, onDayClick,
}: {
  year: number; month: number
  entries: Array<{ date_at: string; type: 'holiday' | 'weekday'; name_th: string }>
  color: string
  onDayClick: (ds: string, existing?: { date_at: string; type: 'holiday' | 'weekday'; name_th: string }) => void
}) {
  const { t, lang } = useLang()
  const DAY_HEADERS = lang === 'en' ? DAY_HEADERS_EN : DAY_HEADERS_TH
  const total = daysInMonth(year, month)
  const startDow = firstDow(year, month)
  const entryMap = useMemo(() => {
    const m: Record<string, typeof entries[0]> = {}
    entries.forEach(e => { m[e.date_at] = e })
    return m
  }, [entries])

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1.5">
        {DAY_HEADERS.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-bold py-1 ${i === 0 || i === 6 ? 'text-red-400' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array(startDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1
          const date = ds(year, month, day)
          const dow = new Date(date).getDay()
          const isWE = dow === 0 || dow === 6
          const ent = entryMap[date]
          return (
            <button
              key={date}
              onClick={() => onDayClick(date, ent)}
              title={ent ? `${ent.name_th} (${t('calendar', 'clickToDelete')})` : isWE ? t('calendar', 'weekend') : t('calendar', 'clickToAdd2')}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] transition-all border relative group ${ent?.type === 'holiday'
                ? 'font-bold border-2 hover:opacity-80'
                : ent?.type === 'weekday'
                  ? 'font-bold border-2 hover:opacity-80'
                  : isWE
                    ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-default'
                    : 'bg-white border-slate-100 text-slate-600 hover:border-opacity-60 cursor-pointer'
                }`}
              style={ent ? {
                background: ent.type === 'holiday' ? color + '18' : color + '10',
                borderColor: color,
                color,
              } : undefined}
            >
              <span className="font-semibold leading-tight">{day}</span>
              {ent && (
                <span className="text-[7px] leading-tight truncate w-full text-center px-0.5 mt-px opacity-80">
                  {ent.type === 'holiday' ? '🔴' : '🟢'}
                </span>
              )}
              {ent && (
                <span className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                  <Trash2 size={10} className="text-red-500" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function CalendarPage() {

  const { companyPlants, companies,loadCompanies } = useCompanyStore()
  
const {
  currentCompanyId,
  selectedCompanyPlantId,
  setSelectedCompanyPlantId,
} = useStore()

  const { calendarGroups, calendars,
    loadCalendarGroups, loadCalendars,
    addCalendarGroup, updateCalendarGroup, deleteCalendarGroup,
    addCalendar, deleteCalendar } = useCalendarStore()
  const { t, lang } = useLang()

  useEffect(() => {
    loadCalendarGroups()
    loadCalendars()
    loadCompanies()
  }, [loadCalendarGroups, loadCalendars])
  const MONTH_NAMES = lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_TH
  const displayYear = (y: number) => lang === 'en' ? y : y + 543

  const [selectedPcId, setSelectedPcId] = useState('')
  const [userIsSA, setUserIsSA] = useState(false)
  const [profile, setProfile] = useState<ReturnType<typeof getProfile>>(null)

const availableCompanyPlants = companyPlants.filter((cp: any) =>
  currentCompanyId
    ? cp.company_id === currentCompanyId
    : true
)

  // Read localStorage only on client (avoid SSR hydration mismatch)
  useEffect(() => {
    const sa = isSuperAdmin()
    const p = getProfile()
    setUserIsSA(sa)
    setProfile(p)
    
  if (selectedCompanyPlantId) {
    setSelectedPcId(selectedCompanyPlantId)
  }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyPlantId])

  



  // PC list: non-superadmin sees only their own company-plant; superadmin sees all from store
  const pcList = useMemo(() => {
    if (!userIsSA) {
      const cpId = profile?.companyPlantId
      if (!cpId) return []
      return [{ id: cpId, name_th: profile?.companyName ?? '', code: profile?.companyCode ?? '' }]
    }
  
return availableCompanyPlants.map(cp => {
  const company = companies.find(
    c => c.id === cp.company_id
  )

  
return {
  id: cp.id,
  name_th:
    cp.plants?.name_th ??
    company?.name_th ??
    cp.company_id,

  code:
    cp.plants?.code ??
    company?.code ??
    '',
}

})
  },[ 
 userIsSA,
  profile,
  currentCompanyId,
  availableCompanyPlants,
  companies,

])


  const [selectedGrpId, setSelectedGrpId] = useState<string | null>(null)
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(3)  // April
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [editGroup, setEditGroup] = useState<CalendarGroup | null>(null)
  const [addDayState, setAddDayState] = useState<{ ds: string } | null>(null)

  const pcGroups = useMemo(
    () => calendarGroups.filter(g => g.plant_company_id === selectedPcId),
    [calendarGroups, selectedPcId]
  )

  const selectedGroup = calendarGroups.find(g => g.id === selectedGrpId) ?? null

  // Auto-select first group when switching pc
 
const handlePcChange = (pcId: string) => {
  setSelectedPcId(pcId)
  setSelectedCompanyPlantId(pcId)

  const first = calendarGroups.find(
    g => g.plant_company_id === pcId
  )

  setSelectedGrpId(first?.id ?? null)
}


  // Select first group if none selected
useEffect(() => {
  if (!selectedGrpId && pcGroups.length > 0) {
    setSelectedGrpId(pcGroups[0].id)
  }
}, [pcGroups, selectedGrpId])


  const groupEntries = useMemo(
    () => calendars.filter(c => c.calendar_group_id === selectedGrpId),
    [calendars, selectedGrpId]
  )

  const monthStr = `${year}-${pad(month + 1)}`
  const monthEntries = groupEntries.filter(c => c.date_at.startsWith(monthStr))

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const handleDayClick = (date: string, existing?: { date_at: string }) => {
    if (existing) {
      const cal = calendars.find(c => c.date_at === date && c.calendar_group_id === selectedGrpId)
      if (cal) deleteCalendar(cal.id)
    } else {
      setAddDayState({ ds: date })
    }
  }

  return (
    <div className="flex gap-5 animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>

      {/* ── Left: calendar list ──────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col gap-3">

        {/* PC selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
          {pcList.map(pc => (
            <button
              key={pc.id}
              onClick={() => handlePcChange(pc.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${selectedPcId === pc.id
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${selectedPcId === pc.id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {pc.code?.slice(0, 2) ?? pc.id.slice(-1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{pc.name_th || pc.id}</p>
                <p className="text-[10px] text-slate-400">{calendarGroups.filter(g => g.plant_company_id === pc.id).length} {t('calendar', 'calendarsCount')}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Group list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <p className="text-xs font-bold text-slate-800">{t('calendar', 'title')}</p>
            <button
              onClick={() => setShowAddGroup(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:bg-sky-50 px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={11} /> {t('calendar', 'newLabel')}
            </button>
          </div>

          <div className="p-2 space-y-1">
            {pcGroups.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">{t('calendar', 'noCal')}</p>
                <button onClick={() => setShowAddGroup(true)} className="text-xs text-sky-500 hover:underline mt-1">+ {t('calendar', 'createFirst')}</button>
              </div>
            ) : (
              pcGroups.map(grp => {
                const count = calendars.filter(c => c.calendar_group_id === grp.id).length
                const holidays = calendars.filter(c => c.calendar_group_id === grp.id && c.type === 'holiday').length
                const isSelected = selectedGrpId === grp.id
                return (
                  <div
                    key={grp.id}
                    onClick={() => setSelectedGrpId(grp.id)}
                    className={`group rounded-xl px-3 py-2.5 cursor-pointer transition-all ${isSelected ? 'shadow-sm' : 'hover:bg-slate-50'}`}
                    style={isSelected ? { background: grp.color + '12', border: `1.5px solid ${grp.color}55` } : { border: '1.5px solid transparent' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: grp.color }} />
                      <p className={`text-xs font-bold flex-1 min-w-0 truncate ${isSelected ? '' : 'text-slate-700'}`}
                        style={isSelected ? { color: grp.color } : undefined}>
                        {grp.name}
                      </p>
                      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                        <button onClick={e => { e.stopPropagation(); setEditGroup(grp) }}
                          className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-white transition-colors">
                          <Edit2 size={10} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); if (confirm(`${t('common', 'delete')} "${grp.name}"?`)) deleteCalendarGroup(grp.id) }}
                          className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    {grp.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5 ml-5 truncate">{grp.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 ml-5">
                      <span className="text-[9px] text-rose-500 flex items-center gap-0.5">
                        <Umbrella size={8} /> {holidays}
                      </span>
                      <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                        <Sun size={8} /> {count - holidays}
                      </span>
                      <span className="text-[9px] text-slate-400 ml-auto">{count} {t('calendar', 'days')}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Center: calendar view ─────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {selectedGroup ? (
          <>
            {/* Calendar header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: selectedGroup.color + '18', border: `1.5px solid ${selectedGroup.color}` }}>
                    <CalendarDays size={16} style={{ color: selectedGroup.color }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">{selectedGroup.name}</h2>
                    {selectedGroup.description && <p className="text-[10px] text-slate-400">{selectedGroup.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Month nav */}
                  <div className="flex items-center gap-1 bg-slate-50 rounded-xl border border-slate-200 p-1">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 transition-colors hover:shadow-sm"><ChevronLeft size={15} /></button>
                    <span className="text-xs font-bold text-slate-800 min-w-[130px] text-center">{MONTH_NAMES[month]} {displayYear(year)}</span>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 transition-colors hover:shadow-sm"><ChevronRight size={15} /></button>
                  </div>
                  <button
                    onClick={() => setAddDayState({ ds: ds(year, month, 1) })}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white transition-colors hover:opacity-90"
                    style={{ background: selectedGroup.color }}
                  >
                    <Plus size={13} /> {t('calendar', 'addDayBtn')}
                  </button>
                </div>
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-4 px-5 py-2 bg-slate-50/50 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: selectedGroup.color + '18', border: `1.5px solid ${selectedGroup.color}` }} /><span className="text-slate-500">{t('calendar', 'schedule2')}</span></div>
                  <span className="text-rose-500 font-bold flex items-center gap-1"><Umbrella size={11} /> {monthEntries.filter(c => c.type === 'holiday').length} {t('calendar', 'holidayType')}</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><Sun size={11} /> {monthEntries.filter(c => c.type === 'weekday').length} {t('calendar', 'specialWork')}</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200" /><span className="text-slate-400">{t('calendar', 'weekend')}</span>
                </div>
              </div>

              <div className="p-5">
                <MonthGrid
                  year={year}
                  month={month}
                  entries={monthEntries.map(c => ({ date_at: c.date_at, type: c.type, name_th: c.name_th }))}
                  color={selectedGroup.color}
                  onDayClick={handleDayClick}
                />
                <p className="text-[10px] text-slate-400 mt-3 text-center">{t('calendar', 'clickToRemove')} · {t('calendar', 'clickToAdd')}</p>
              </div>
            </div>

            {/* Events list for month */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">
                  {t('calendar', 'listItems')} {MONTH_NAMES[month]} {displayYear(year)} ({monthEntries.length} {t('calendar', 'days')})
                </p>
              </div>
              {monthEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">{t('calendar', 'noItemsMonth')}</p>
                  <button onClick={() => setAddDayState({ ds: ds(year, month, 1) })} className="text-xs hover:underline mt-1" style={{ color: selectedGroup.color }}>+ {t('calendar', 'addDayBtn')}</button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                  {monthEntries.sort((a, b) => a.date_at.localeCompare(b.date_at)).map(cal => (
                    <div key={cal.id} className="flex items-center gap-3 px-5 py-2.5 group hover:bg-slate-50 transition-colors">
                      <div className="w-2 rounded-full flex-shrink-0" style={{ height: 28, background: cal.type === 'holiday' ? '#ef4444' : '#10b981' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{cal.name_th}</p>
                        <p className="text-[10px] font-mono text-slate-400">{cal.date_at} · {cal.type === 'holiday' ? t('calendar', 'holidayType') : t('calendar', 'specialWork')}</p>
                      </div>
                      <button onClick={() => deleteCalendar(cal.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 rounded-lg transition-all hover:bg-red-50">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <CalendarDays size={40} className="mb-3 text-slate-200" />
            <p className="text-sm font-semibold text-slate-500">{t('calendar', 'selectOrCreate')}</p>
            <p className="text-xs mt-1">{t('calendar', 'selectFromList')}</p>
            <button onClick={() => setShowAddGroup(true)} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors">
              <Plus size={13} /> {t('calendar', 'createFirst')}
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {showAddGroup && (
        <AddGroupModal
          pcId={selectedPcId}
          onClose={() => setShowAddGroup(false)}
          onSave={async (name, color, desc) => {
            const created = await addCalendarGroup({ plant_company_id: selectedPcId, name, color, description: desc || undefined })
            if (created) setSelectedGrpId(created.id)
          }}
        />
      )}

      {editGroup && (
        <EditGroupModal
          group={editGroup}
          onClose={() => setEditGroup(null)}
          onSave={(id, name, color, desc) => {
            updateCalendarGroup(id, { name, color, description: desc || null })
            setEditGroup(null)
          }}
        />
      )}

      {addDayState && selectedGroup && (
        <AddDayModal
          initDate={addDayState.ds}
          group={selectedGroup}
          onClose={() => setAddDayState(null)}
          onSave={(date, type, name) => {
            addCalendar({
              plant_company_id: selectedPcId,
              calendar_group_id: selectedGroup.id,
              name_th: name,
              name_en: name,
              date_at: date,
              type,
            })
          }}
        />
      )}
    </div>
  )
}
