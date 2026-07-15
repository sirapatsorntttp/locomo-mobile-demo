'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { getProfile, clearTokens, StoredProfile } from '@/lib/auth-token'
import { apiFetch } from '@/lib/api-fetch'
import {
  Search, Bell, Settings, ChevronDown, Globe,
  AlertTriangle, CheckCircle2, Info, Flame, Bus,
  ScanLine, Calendar, Shield, LogOut, KeyRound,
  Moon, Sun, Monitor, BellOff, BellRing, Sliders,
  Radio, X, CheckCheck, Clock, Eye, EyeOff, Loader2,
  Check, AlertCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
type NotifLevel = 'critical' | 'warning' | 'info' | 'success'

interface Notification {
  id: string
  level: NotifLevel
  category: string
  title: string
  body: string
  time: string
  read: boolean
}

// ── Mock notifications ─────────────────────────────────────────
const MOCK_NOTIFS: Notification[] = [
  { id:'n1', level:'critical', category:'เหตุการณ์', title:'รถเสียกลางทาง — POST-002', body:'คนขับรายงานรถเสียบริเวณแยกพระโขนง ต้องการความช่วยเหลือ', time:'06:41', read:false },
  { id:'n2', level:'warning',  category:'ล่าช้า',     title:'POST-004 ล่าช้า 15 นาที', body:'เที่ยวสาย C ตะวันออก ยังไม่ผ่าน CP1 เกินเวลาที่กำหนด', time:'06:52', read:false },
  { id:'n3', level:'warning',  category:'การจอง',     title:'คิวอนุมัติ 8 รายการ', body:'มีการจองรอการอนุมัติจากผู้จัดการ 8 รายการ', time:'07:00', read:false },
  { id:'n4', level:'info',     category:'สแกน',       title:'พนักงานไม่มีการจอง', body:'สแกน RFID รหัส 223311 — ไม่พบการจองในระบบ (POST-002)', time:'06:33', read:false },
  { id:'n5', level:'success',  category:'ระบบ',       title:'Backup สำเร็จ', body:'สำรองข้อมูลระบบประจำวันเสร็จสมบูรณ์', time:'05:00', read:true },
  { id:'n6', level:'info',     category:'GPS',        title:'รถ POST-001 ออกจากโซน', body:'ยานพาหนะทะเบียน ขก-1234 ออกนอกรัศมี Geofence ที่กำหนด', time:'06:25', read:true },
  { id:'n7', level:'warning',  category:'เหตุการณ์', title:'ผู้โดยสารลืมสัมภาระ', body:'POST-003 สาย C — กระเป๋าถูกลืมไว้บนรถ ติดต่อคนขับแล้ว', time:'06:55', read:true },
]

const LEVEL_CFG: Record<NotifLevel, { icon: React.ReactNode; dot: string; bg: string; border: string }> = {
  critical: { icon: <Flame size={13} className="text-red-500"/>,           dot:'bg-red-500',     bg:'bg-red-50',     border:'border-red-200' },
  warning:  { icon: <AlertTriangle size={13} className="text-amber-500"/>, dot:'bg-amber-400',   bg:'bg-amber-50',   border:'border-amber-200' },
  info:     { icon: <Info size={13} className="text-sky-500"/>,            dot:'bg-sky-400',     bg:'bg-sky-50',     border:'border-sky-200' },
  success:  { icon: <CheckCircle2 size={13} className="text-emerald-500"/>,dot:'bg-emerald-400', bg:'bg-emerald-50', border:'border-emerald-200' },
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  'เหตุการณ์': <Flame size={10}/>,
  'ล่าช้า':    <Clock size={10}/>,
  'การจอง':   <Calendar size={10}/>,
  'สแกน':     <ScanLine size={10}/>,
  'GPS':       <Radio size={10}/>,
  'ระบบ':     <Shield size={10}/>,
}

type ThemeMode = 'light' | 'dark' | 'system'

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return { open, setOpen, ref }
}

// ── Change Password Modal ──────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!current)              { setError('กรุณาระบุรหัสผ่านปัจจุบัน'); return }
    if (next.length < 8)       { setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'); return }
    if (next !== confirm)      { setError('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน'); return }
    if (next === current)      { setError('รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม'); return }

    setSaving(true)
    try {
      const res  = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = json?.error?.th ?? json?.error?.en ?? json?.message?.th ?? 'เกิดข้อผิดพลาด'
        setError(msg)
        return
      }
      setSuccess(true)
      // Force re-login after password change
      setTimeout(() => { clearTokens(); window.location.href = '/login' }, 2000)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const PasswordInput = ({
    label, value, onChange, show, onToggle, placeholder,
  }: {
    label: string; value: string; onChange: (v: string) => void
    show: boolean; onToggle: () => void; placeholder?: string
  }) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff size={14}/> : <Eye size={14}/>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
              <KeyRound size={14} className="text-sky-600"/>
            </div>
            <h3 className="text-sm font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={14}/>
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Check size={24} className="text-emerald-600"/>
            </div>
            <p className="text-sm font-bold text-slate-800">เปลี่ยนรหัสผ่านสำเร็จ</p>
            <p className="text-xs text-slate-500">กำลังนำคุณออกจากระบบเพื่อเข้าสู่ระบบใหม่…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <PasswordInput
              label="รหัสผ่านปัจจุบัน"
              value={current}
              onChange={setCurrent}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
            />
            <PasswordInput
              label="รหัสผ่านใหม่"
              value={next}
              onChange={setNext}
              show={showNext}
              onToggle={() => setShowNext(v => !v)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
            <PasswordInput
              label="ยืนยันรหัสผ่านใหม่"
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
            />

            {/* Strength hint */}
            {next.length > 0 && (
              <div className="flex items-center gap-2">
                {[4, 6, 8, 10].map(len => (
                  <div key={len} className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    next.length >= len ? (
                      next.length >= 10 ? 'bg-emerald-400' :
                      next.length >= 8  ? 'bg-sky-400' :
                      next.length >= 6  ? 'bg-amber-400' : 'bg-red-400'
                    ) : 'bg-slate-100',
                  )}/>
                ))}
                <span className="text-[10px] text-slate-400 flex-shrink-0">
                  {next.length >= 10 ? 'แข็งแกร่งมาก' : next.length >= 8 ? 'ดี' : next.length >= 6 ? 'พอใช้' : 'อ่อนเกินไป'}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle size={12} className="flex-shrink-0"/>{error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                ยกเลิก
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin"/> : <KeyRound size={14}/>}
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function Header() {
  const { lang, setLang, t } = useLang()
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifs, setNotifs]               = useState<Notification[]>(MOCK_NOTIFS)
  const [themeMode, setThemeMode]         = useState<ThemeMode>('light')
  const [soundOn, setSoundOn]             = useState(true)
  const [notifFilter, setNotifFilter]     = useState<'all'|'unread'>('all')
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [loggingOut, setLoggingOut]       = useState(false)

  const [profile, setProfile] = useState<StoredProfile | null>(null)

  useEffect(() => {
    setProfile(getProfile())
  }, [])

  const notifDropdown    = useDropdown()
  const settingsDropdown = useDropdown()
  const profileDropdown  = useDropdown()
  const langDropdown     = useDropdown()

  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : 'U'
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : 'User'
  const displayEmail = profile?.email ?? ''
  const displayRole = profile?.roles?.[0] ?? ''

  const unread      = notifs.filter(n => !n.read)
  const unreadCount = unread.length
  const visibleNotifs = notifFilter === 'unread' ? notifs.filter(n => !n.read) : notifs

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  const markRead    = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  const dismiss     = (id: string) => setNotifs(ns => ns.filter(n => n.id !== id))

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore — clear tokens regardless */ }
    clearTokens()
    window.location.href = '/login'
  }

  const THEME_OPTS: { key: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { key:'light',  label: t('header', 'themeLight'),  icon:<Sun size={13}/>     },
    { key:'dark',   label: t('header', 'themeDark'),   icon:<Moon size={13}/>    },
    { key:'system', label: t('header', 'themeSystem'), icon:<Monitor size={13}/> },
  ]

  const LANG_OPTS = [
    { key: 'th' as const, label: 'ไทย',    flag: '🇹🇭' },
    { key: 'en' as const, label: 'English', flag: '🇬🇧' },
  ]

  return (
    <>
      <header className="h-[60px] bg-white border-b border-slate-100 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm relative z-30">

        {/* ── Search ─────────────────────────────────────────────── */}
        <div className={cn(
          'flex items-center gap-2.5 bg-slate-50 border rounded-xl px-3.5 py-2 w-72 transition-all duration-200',
          searchFocused ? 'border-sky-300 ring-2 ring-sky-100 bg-white' : 'border-slate-200'
        )}>
          <Search size={14} className={cn('flex-shrink-0 transition-colors', searchFocused ? 'text-sky-500' : 'text-slate-400')} />
          <input
            type="text"
            placeholder={t('header', 'searchPlaceholder')}
            className="bg-transparent text-xs text-slate-600 placeholder:text-slate-400 outline-none w-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden sm:inline-flex text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono flex-shrink-0 border border-slate-200">
            ⌘K
          </kbd>
        </div>

        <div className="flex-1" />

        {/* ── Actions ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5">

          {/* ── Language switcher ──────────────────────────────── */}
          <div ref={langDropdown.ref} className="relative">
            <button
              onClick={() => { langDropdown.setOpen(o => !o); notifDropdown.setOpen(false); settingsDropdown.setOpen(false); profileDropdown.setOpen(false) }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors border',
                langDropdown.open
                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-slate-200'
              )}
            >
              <Globe size={13} />
              <span className="font-semibold">{lang.toUpperCase()}</span>
              <ChevronDown size={10} className={cn('transition-transform duration-200', langDropdown.open && 'rotate-180')} />
            </button>

            {langDropdown.open && (
              <div className="absolute right-0 top-11 w-[150px] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2.5 pb-1">Language</p>
                {LANG_OPTS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setLang(opt.key); langDropdown.setOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors',
                      lang === opt.key ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span className="text-base leading-none">{opt.flag}</span>
                    <span>{opt.label}</span>
                    {lang === opt.key && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Notification bell ──────────────────────────────── */}
          <div ref={notifDropdown.ref} className="relative">
            <button
              onClick={() => { notifDropdown.setOpen(o => !o); settingsDropdown.setOpen(false); profileDropdown.setOpen(false); langDropdown.setOpen(false) }}
              className={cn(
                'relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
                notifDropdown.open ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              )}
            >
              <Bell size={17}/>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifDropdown.open && (
              <div className="absolute right-0 top-11 w-[380px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-slate-600"/>
                    <span className="text-sm font-bold text-slate-800">{t('header', 'notifications')}</span>
                    {unreadCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                        {unreadCount} {t('header', 'newBadge')}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1">
                      <CheckCheck size={11}/> {t('header', 'markAllRead')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                  {(['all','unread'] as const).map(f => (
                    <button key={f} onClick={() => setNotifFilter(f)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-[10px] font-semibold transition-all',
                        notifFilter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                      )}>
                      {f === 'all'
                        ? `${t('header', 'filterAll')} (${notifs.length})`
                        : `${t('header', 'filterUnread')} (${unreadCount})`}
                    </button>
                  ))}
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  {visibleNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
                      <BellOff size={24}/>
                      <p className="text-xs">{t('header', 'noNotifs')}</p>
                    </div>
                  ) : visibleNotifs.map(n => {
                    const cfg = LEVEL_CFG[n.level]
                    return (
                      <div key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group',
                          !n.read && 'bg-sky-50/30'
                        )}
                        onClick={() => markRead(n.id)}
                      >
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border', cfg.bg, cfg.border)}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', cfg.bg, cfg.border)}>
                              <span className="flex items-center gap-0.5">{CAT_ICONS[n.category]}{n.category}</span>
                            </span>
                            {!n.read && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)}/>}
                          </div>
                          <p className={cn('text-xs font-semibold leading-tight', !n.read ? 'text-slate-800' : 'text-slate-600')}>{n.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                          <p className="text-[9px] text-slate-300 mt-1 font-mono">{n.time}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                          className="flex-shrink-0 p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all mt-0.5">
                          <X size={11}/>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                  <button className="w-full text-center text-[10px] text-sky-600 hover:text-sky-700 font-semibold">
                    {t('header', 'viewAll')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Settings ───────────────────────────────────────── */}
          <div ref={settingsDropdown.ref} className="relative">
            <button
              onClick={() => { settingsDropdown.setOpen(o => !o); notifDropdown.setOpen(false); profileDropdown.setOpen(false); langDropdown.setOpen(false) }}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
                settingsDropdown.open ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              )}
            >
              <Settings size={17} className={settingsDropdown.open ? 'rotate-45 transition-transform duration-300' : 'transition-transform duration-300'}/>
            </button>

            {settingsDropdown.open && (
              <div className="absolute right-0 top-11 w-[300px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <Sliders size={14} className="text-slate-600"/>
                  <span className="text-sm font-bold text-slate-800">{t('header', 'quickSettings')}</span>
                </div>

                <div className="p-4 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('header', 'theme')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {THEME_OPTS.map(opt => (
                        <button key={opt.key} onClick={() => setThemeMode(opt.key)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-[10px] font-semibold transition-all',
                            themeMode === opt.key
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          )}>
                          {opt.icon}{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {soundOn ? <BellRing size={14} className="text-slate-500"/> : <BellOff size={14} className="text-slate-400"/>}
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{t('header', 'notifSound')}</p>
                        <p className="text-[10px] text-slate-400">{t('header', 'notifSoundSub')}</p>
                      </div>
                    </div>
                    <button onClick={() => setSoundOn(v => !v)}
                      className={cn(
                        'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                        soundOn ? 'bg-sky-500' : 'bg-slate-200'
                      )}>
                      <span className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                        soundOn ? 'left-5' : 'left-1'
                      )}/>
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('header', 'quickLinks')}</p>
                    <div className="space-y-1">
                      {[
                        { icon:<Bus size={12}/>,      label: t('header', 'linkVehicles'), href:'/dashboard/vehicles' },
                        { icon:<Shield size={12}/>,   label: t('header', 'linkUsers'),    href:'/dashboard/users' },
                        { icon:<Settings size={12}/>, label: t('header', 'linkSettings'), href:'/dashboard/settings' },
                      ].map(l => (
                        <a key={l.href} href={l.href}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-transparent hover:border-slate-100">
                          <span className="text-slate-400">{l.icon}</span>
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />

          {/* ── User profile ───────────────────────────────────── */}
          <div ref={profileDropdown.ref} className="relative">
            <button
              onClick={() => { profileDropdown.setOpen(o => !o); notifDropdown.setOpen(false); settingsDropdown.setOpen(false); langDropdown.setOpen(false) }}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors',
                profileDropdown.open ? 'bg-slate-100' : 'hover:bg-slate-50'
              )}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-tight">{displayName}</p>
                <p className="text-[10px] text-slate-400">{displayRole || t('header', 'role')}</p>
              </div>
              <ChevronDown size={13} className={cn('text-slate-400 hidden sm:block transition-transform duration-200', profileDropdown.open && 'rotate-180')}/>
            </button>

            {profileDropdown.open && (
              <div className="absolute right-0 top-11 w-[240px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                {/* Profile card */}
                <div className="px-4 py-4 bg-gradient-to-br from-sky-50 to-blue-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-sm font-bold text-white">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                      {displayEmail && <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>}
                      {displayRole && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 mt-0.5">
                          <Shield size={9}/> {displayRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2 space-y-0.5">
                  <button
                    onClick={() => { profileDropdown.setOpen(false); setShowChangePwd(true) }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 transition-colors group">
                    <KeyRound size={13} className="text-slate-400 group-hover:text-sky-600 transition-colors flex-shrink-0"/>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{t('header', 'changePassword')}</p>
                      <p className="text-[10px] text-slate-400">{t('header', 'changePasswordSub')}</p>
                    </div>
                  </button>
                </div>

                {/* Logout */}
                <div className="px-2 pb-2 border-t border-slate-100 pt-2">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-red-50 transition-colors group disabled:opacity-60">
                    {loggingOut
                      ? <Loader2 size={13} className="text-red-400 animate-spin flex-shrink-0"/>
                      : <LogOut size={13} className="text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0"/>}
                    <div>
                      <p className="text-xs font-semibold text-red-500 group-hover:text-red-600">
                        {loggingOut ? 'กำลังออกจากระบบ…' : t('header', 'logout')}
                      </p>
                      <p className="text-[10px] text-slate-400">{t('header', 'logoutSub')}</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Change Password Modal ────────────────────────────────── */}
      {showChangePwd && typeof document !== 'undefined' && createPortal(
        <ChangePasswordModal onClose={() => setShowChangePwd(false)}/>,
        document.body
      )}
    </>
  )
}
