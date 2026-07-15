'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { getProfile, setProfile as saveProfile } from '@/lib/auth-token'
import type { StoredProfile } from '@/lib/auth-token'
import { authHeader } from '@/lib/auth-token'
import { useLang } from '@/lib/lang-context'
import {
  LayoutDashboard, Users, Bus, Map, BookOpen, BarChart3,
  Bell, Settings, Shield, Navigation, UserCheck, Clock,
  CalendarDays, Building2, Truck, CreditCard, ShieldCheck,
  ChevronDown, Layers, Radio, Cpu, Gauge, MessageSquare,
  TableProperties, AlertTriangle, ChevronRight, MapPin, Contact, Lock,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useBookingStore } from '@/lib/stores/booking.store'

interface NavItem { titleKey: string; href: string; icon: React.ReactNode; badge?: number; sub?: string; subTh?: string }
interface NavGroup { labelKey: string; collapsible?: boolean; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    labelKey: 'overview',
    items: [
      { titleKey: 'home', href: '/dashboard', icon: <LayoutDashboard size={14} />, sub: 'overview' },
    ],
  },
  {
    labelKey: 'operations',
    collapsible: true,
    items: [
      { titleKey: 'controlTower', href: '/dashboard/operations', icon: <Radio size={14} />, sub: 'checkpoint · delay · incident' },
      { titleKey: 'consolidation', href: '/dashboard/consolidation', icon: <Cpu size={14} />, sub: 'VRP · route optimizer' },
      { titleKey: 'bookingQueue', href: '/dashboard/bookings', icon: <BookOpen size={14} />, sub: 'approval queue' },
      { titleKey: 'reserves', href: '/dashboard/reserves', icon: <BookOpen size={14} />, sub: 'reserves' },
      { titleKey: 'attendances', href: '/dashboard/attendances', icon: <CreditCard size={14} />, sub: 'attendances' },
      { titleKey: 'tracking', href: '/dashboard/tracking', icon: <Navigation size={14} />, sub: 'trackings' },
      { titleKey: 'hazard', href: '/dashboard/hazard', icon: <AlertTriangle size={14} />, subTh: 'จุดเสี่ยง · อุบัติเหตุ · ถนน', sub: 'risk zones · accidents · roads' },
    ],
  },
  {
    labelKey: 'people',
    collapsible: true,
    items: [
      { titleKey: 'users', href: '/dashboard/users', icon: <Shield size={14} />, sub: 'employee · driver · admin' },
      { titleKey: 'employees', href: '/dashboard/employees', icon: <Users size={14} />, sub: 'employees + defaults' },
      { titleKey: 'drivers', href: '/dashboard/drivers', icon: <UserCheck size={14} />, sub: 'drivers → vehicles' },
    ],
  },
  {
    labelKey: 'fleet',
    collapsible: true,
    items: [
      { titleKey: 'fleetMgmt', href: '/dashboard/fleet', icon: <Gauge size={14} />, sub: 'status · service · assign' },
      { titleKey: 'vehicles', href: '/dashboard/vehicles', icon: <Bus size={14} />, sub: 'vehicles + types' },
      { titleKey: 'vehicleTypes', href: '/dashboard/vehicle-types', icon: <TableProperties size={14} />, sub: 'vehicle_types master' },
      { titleKey: 'vendors', href: '/dashboard/vendors', icon: <Truck size={14} />, sub: 'vendors + coordinators' },
    ],
  },
  {
    labelKey: 'routes',
    collapsible: true,
    items: [
      { titleKey: 'zones', href: '/dashboard/zones', icon: <Layers size={14} />, subTh: 'โซน · เส้นทาง · จุดจอด', sub: 'zone > route > point' },
      { titleKey: 'routePoints', href: '/dashboard/routes', icon: <Map size={14} />, sub: 'routes + points' },
      { titleKey: 'shifts', href: '/dashboard/shifts', icon: <Clock size={14} />, sub: 'shifts' },
      { titleKey: 'posts', href: '/dashboard/posts', icon: <Layers size={14} />, sub: 'route + shift + driver' },
      { titleKey: 'schedule', href: '/dashboard/schedule', icon: <TableProperties size={14} />, subTh: 'ตารางรถ วัน/หยุด', sub: 'schedule days/holidays' },
      { titleKey: 'calendar', href: '/dashboard/calendar', icon: <CalendarDays size={14} />, sub: 'calendars' },
    ],
  },
  {
    labelKey: 'org',
    collapsible: true,
    items: [
      { titleKey: 'companies', href: '/dashboard/companies', icon: <Building2 size={14} />, subTh: 'TTTP · Customer · Vendor', sub: 'TTTP · Customer · Vendor' },
      { titleKey: 'plants', href: '/dashboard/plants', icon: <MapPin size={14} />, subTh: 'Gateway · BPK · EISE · IPP', sub: 'plant locations' },
      { titleKey: 'coordinators', href: '/dashboard/coordinators', icon: <Contact size={14} />, subTh: 'Vendor · Locomo · HR/GA', sub: 'Vendor · Locomo · HR/GA' },
      { titleKey: 'organization', href: '/dashboard/organization', icon: <Building2 size={14} />, sub: 'divisions · dept · section' },
      { titleKey: 'bookingPolicies', href: '/dashboard/booking-policies', icon: <ShieldCheck size={14} />, subTh: 'กฎการจองต่อ Client', sub: 'booking rules per client' },
    ],
  },
  {
    labelKey: 'reports',
    collapsible: true,
    items: [
      { titleKey: 'reportUsage', href: '/dashboard/reports/usage', icon: <BarChart3 size={14} />, sub: 'reserves stats' },
      { titleKey: 'reportAttendance', href: '/dashboard/reports/attendance', icon: <CreditCard size={14} />, sub: 'attendance logs' },
      { titleKey: 'reportVehicles', href: '/dashboard/reports/vehicles', icon: <Bus size={14} />, sub: 'vehicle utilization' },
      { titleKey: 'reportAuth', href: '/dashboard/reports/auth', icon: <Shield size={14} />, sub: 'auth_logs' },
    ],
  },
  {
    labelKey: 'system',
    collapsible: true,
    items: [
      { titleKey: 'permissions', href: '/dashboard/permissions', icon: <Shield size={14} />, sub: 'roles · modules · access' },
      { titleKey: 'feedback', href: '/dashboard/feedback', icon: <MessageSquare size={14} />, subTh: 'แนะนำ · ติชม · คะแนน', sub: 'suggestions · feedback · ratings' },
      { titleKey: 'notifications', href: '/dashboard/notifications', icon: <Bell size={14} />, badge: 3, sub: 'notifications' },
      { titleKey: 'settings', href: '/dashboard/settings', icon: <Settings size={14} />, sub: 'modules · permissions' },
    ],
  },
]

// Menus visible to company admin (non-superadmin)
const COMPANY_ADMIN_HREFS = new Set([
  '/dashboard',
  '/dashboard/operations',
  '/dashboard/bookings',
  '/dashboard/reserves',
  '/dashboard/attendances',
  '/dashboard/tracking',
  '/dashboard/users',
  '/dashboard/employees',
  '/dashboard/drivers',
  '/dashboard/vehicles',
  '/dashboard/vehicle-types',
  '/dashboard/vendors',
  '/dashboard/zones',
  '/dashboard/routes',
  '/dashboard/shifts',
  '/dashboard/posts',
  '/dashboard/schedule',
  '/dashboard/calendar',
  '/dashboard/organization',
  '/dashboard/booking-policies',
  '/dashboard/feedback',
  '/dashboard/notifications',
])

function getStoredProfile(): { roleTypes?: string[]; allowedModules?: string[] } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user_profile')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function Sidebar() {
  const pathname = usePathname()
  const { currentCompanyId, setCurrentCompany, setSelectedCompanyPlantId } = useStore()
  const { bookingPolicies, loadBookingPolicies } = useBookingStore()
  const { companyPlants } = useCompanyStore()
  const { lang, t } = useLang()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null)
  const [profile, setProfile] = useState<StoredProfile | null>(null)
  const [lockedCompanyName, setLockedCompanyName] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Array<{
    id: string
    name_th: string
    name_en: string
    code: string
    companys_plants?: Array<{
      id: string
      company_id: string
      plant_id: string
      plant?: {
        id: string
        code: string
        name_th: string
        name_en: string
      }
    }>
  }>>([])
  const companyFetchedRef = useRef(false)

  useEffect(() => {
    // Read from localStorage immediately (no flicker)
    const p = getProfile()
    setProfile(p)
    if (Array.isArray(p?.allowedModules)) setAllowedModules(p!.allowedModules)
    if (p?.companyId && !p.roleTypes?.includes('superadmin')) {
      setCurrentCompany(p.companyId)
    }

    // Then re-fetch from server so permission changes take effect without re-login
    fetch('/api/auth/profile', { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        if (!json.success || !json.data) return
        const fresh = json.data as StoredProfile
        saveProfile(fresh)
        setProfile(fresh)
        if (Array.isArray(fresh.allowedModules)) setAllowedModules(fresh.allowedModules)
      })
      .catch(() => { })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Load booking policies once for the company badge
  useEffect(() => {
    if (bookingPolicies.length === 0) loadBookingPolicies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch company list for superadmin switcher
  useEffect(() => {
    const p = getProfile()
    if (!p?.roleTypes?.includes('superadmin')) return
    fetch('/api/companies?limit=200&page=1', { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        if (!json.success) return
        const list = Array.isArray(json.data?.data) ? json.data.data : Array.isArray(json.data) ? json.data : []
        setCompanies(list)

        if (!currentCompanyId && list.length > 0) {
          const firstCompany = list[0]

          setCurrentCompany(firstCompany.id)

          const cp = companyPlants.find(
            cp => cp.company_id === firstCompany.id
          )

          setSelectedCompanyPlantId(cp?.id ?? '')
        }



      })
      .catch(() => { })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One-time fetch to resolve company name if missing from stored profile
  useEffect(() => {
    const p = getProfile()
    if (!p || p.companyName || !p.companyId || companyFetchedRef.current) return
    companyFetchedRef.current = true
    fetch(`/api/companies/${p.companyId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        if (!json.success) return
        const company = json.data
        if (!company) return
        const name = company.name_th ?? company.name_en ?? null
        const code = company.code ?? null
        setLockedCompanyName(name)
        const updated = { ...p, companyName: name, companyCode: code }
        saveProfile(updated)
        setProfile(updated)
      })
      .catch(() => { })
  }, [])

  function canShowItem(href: string): boolean {
    // null = profile not yet loaded → show all temporarily to avoid blank sidebar
    if (!profile || allowedModules === null) return true

    const isSA = profile.roleTypes?.includes('superadmin') ?? false
    if (isSA) return true  // superadmin sees everything

    // Company admin: COMPANY_ADMIN_HREFS is the hard ceiling
    if (!COMPANY_ADMIN_HREFS.has(href)) return false

    // Empty allowedModules = role has no modules assigned = show nothing
    if (allowedModules.length === 0) return false

    return allowedModules.some(d => d === href)
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const buildInitialOpen = () => {
    const state: Record<string, boolean> = {}
    navGroups.forEach(group => {
      if (group.collapsible) {
        state[group.labelKey] = group.items.some(item => isActive(item.href))
      }
    })
    return state
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(buildInitialOpen)

  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev }
      navGroups.forEach(group => {
        if (group.collapsible && group.items.some(item => isActive(item.href))) {
          next[group.labelKey] = true
        }
      })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const canSwitch = profile?.roleTypes?.includes('superadmin') ?? false

  const resolvedCompanyName = profile?.companyName ?? lockedCompanyName ?? null
  const currentCompany = canSwitch
    ? companies.find(c => c.id === currentCompanyId)
    : { name_th: resolvedCompanyName ?? '—', name_en: resolvedCompanyName ?? '—', code: profile?.companyCode ?? '' }







  const activePolicy = bookingPolicies.find(p => p.company_id === currentCompanyId && p.is_status === 'active')

  return (
    <aside className="w-60 h-full bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-sm">
      {/* Logo */}
      <div className="h-[60px] flex items-center px-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Bus size={14} className="text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-slate-800 tracking-tight">LOCOMO</span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-slate-400 font-medium">
                {t('header', 'online')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 space-y-1">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => canShowItem(item.href))
          if (visibleItems.length === 0) return null

          const isOpen = !group.collapsible || openGroups[group.labelKey]
          const hasActive = visibleItems.some(item => isActive(item.href))
          const groupLabel = t('nav', group.labelKey as never)

          return (
            <div key={group.labelKey}>
              {group.collapsible ? (
                <button
                  onClick={() => toggleGroup(group.labelKey)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded-md mb-0.5 transition-colors',
                    hasActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-widest',
                    hasActive ? 'text-sky-500' : 'text-slate-400'
                  )}>
                    {groupLabel}
                  </span>
                  <ChevronRight
                    size={10}
                    className={cn('transition-transform duration-200 flex-shrink-0', isOpen && 'rotate-90')}
                  />
                </button>
              ) : (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1 pt-1">
                  {groupLabel}
                </p>
              )}

              {isOpen && (
                <ul className={cn('space-y-px', group.collapsible && 'pl-1 border-l border-slate-100 ml-2 mb-2')}>
                  {visibleItems.map(item => {
                    const active = isActive(item.href)
                    const itemTitle = t('nav', item.titleKey as never)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 group',
                            active ? 'nav-active' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span className={cn('flex-shrink-0 transition-colors', active ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600')}>
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate leading-tight">{itemTitle}</p>
                            {(item.sub || item.subTh) && (
                              <p className="text-[9px] text-slate-400 font-mono truncate leading-tight mt-px">
                                {lang === 'th' ? (item.subTh ?? item.sub) : item.sub}
                              </p>
                            )}
                          </div>
                          {item.badge != null && (
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0', active ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500')}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Company Switcher Footer ─────────────────────────────── */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0">
        <div className="relative">

          {/* ── Locked (non-superadmin) ── */}
          {!canSwitch ? (
            <div className="w-full bg-gradient-to-r from-slate-50 to-slate-50 rounded-lg p-3 border border-slate-200 text-left">
              <div className="flex items-center gap-1.5 mb-1 justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 size={10} className="text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {t('company', 'label')}
                  </span>
                </div>
                <Lock size={9} className="text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-700 leading-tight truncate">{currentCompany?.name_th ?? '—'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono text-slate-400">{currentCompany?.code}</span>
                {activePolicy ? (
                  <span className="text-[9px] px-1.5 py-px rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                    {activePolicy.booking_policy_rules?.booking_mode === 'assigned' ? '🤖 Assigned' : '📋 Self'}
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                    {t('company', 'noPolicy')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* ── Switchable (superadmin only) ── */
            <>
              <button
                onClick={() => setSwitcherOpen(o => !o)}
                className="w-full bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-3 border border-sky-100 hover:border-sky-200 transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 mb-1 justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={10} className="text-sky-500" />
                    <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wide">
                      {t('company', 'label')}
                    </span>
                  </div>
                  <ChevronDown size={10} className={cn('text-sky-400 transition-transform', switcherOpen && 'rotate-180')} />
                </div>
                <p className="text-xs font-bold text-slate-700 leading-tight truncate">{currentCompany?.name_th ?? '—'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono text-slate-400">{currentCompany?.code}</span>
                  {activePolicy ? (
                    <span className="text-[9px] px-1.5 py-px rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                      {activePolicy.booking_policy_rules?.booking_mode === 'assigned' ? '🤖 Assigned' : '📋 Self'}
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                      {t('company', 'noPolicy')}
                    </span>
                  )}
                </div>
              </button>

              {switcherOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2.5 pb-1">
                    {t('company', 'select')}
                  </p>
                  {companies.map(c => {
                    const pol = bookingPolicies.find(p => p.company_id === c.id && p.is_status === 'active')
                    const isSelected = c.id === currentCompanyId

                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCurrentCompany(c.id)


                          const cp = companyPlants?.find(
                            cp => cp.company_id === c.id
                          )


                          setSelectedCompanyPlantId(cp?.id ?? '')
                          setSwitcherOpen(false)
                        }}

                        className={cn(
                          'w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors text-xs',
                          isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                        )}
                      >
                        <div className="min-w-0">
                          <p className={cn('font-semibold truncate', isSelected ? 'text-sky-700' : 'text-slate-700')}>
                            {c.name_th}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">{c.code}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {pol ? (
                            <span className="text-[9px] px-1.5 py-px rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 whitespace-nowrap">
                              {pol.booking_policy_rules?.booking_mode === 'assigned' ? '🤖 Assigned' : '📋 Self'}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-100 text-slate-400 border border-slate-200 whitespace-nowrap">
                              {t('company', 'noPolicy')}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </aside>
  )
}
