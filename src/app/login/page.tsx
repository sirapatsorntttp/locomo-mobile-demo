'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bus, Eye, EyeOff, ArrowRight, Shield, Navigation,
  Cpu, Gauge, Radio, Lock, User, ChevronDown, CheckCircle2,MapPin,
} from 'lucide-react'
import { useLang } from '@/lib/lang-context'

const DEMO_ACCOUNTS_BASE = [
  { role: 'Super Admin',    username: 'superadmin', descKey: 'descAdmin' as const,   color: 'from-violet-500 to-purple-600' },
  { role: 'Fleet Manager',  username: 'emp002', descKey: 'descManager' as const, color: 'from-sky-500 to-blue-600'    },
  { role: 'Operations',     username: 'nic_admin', descKey: null,                   color: 'from-emerald-500 to-teal-600', desc: 'Control Center & Tracking' },
  { role: 'Driver',         username: 'emp004', descKey: 'descDriver' as const,  color: 'from-amber-500 to-orange-600' },
]

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLang()

  const DEMO_ACCOUNTS = DEMO_ACCOUNTS_BASE.map(a => ({
    ...a,
    desc: a.descKey ? t('login', a.descKey) : (a.desc ?? ''),
  }))

  const FEATURES = [
    { icon: <Radio size={16} />,      label: 'Control Center',       sub: t('login','featureControlTower') },
    { icon: <Cpu size={16} />,        label: 'AI Route Optimizer',  sub: 'VRP + Fleet Flex'              },
    { icon: <Gauge size={16} />,      label: 'Fleet Management',    sub: t('login','featureFleet')        },
    { icon: <Navigation size={16} />, label: 'GPS Tracking',        sub: 'Live map · Checkpoint'          },
  ]

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [roleOpen, setRoleOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selectedRole = DEMO_ACCOUNTS[selectedIdx]

  function selectDemo(acc: typeof DEMO_ACCOUNTS[0], idx: number) {
    setSelectedIdx(idx)
    setUsername(acc.username)
    setPassword('Admin1234!')
    setRoleOpen(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) { setError(t('login','usernameRequired')); return }
    if (!password.trim()) { setError(t('login','passwordRequired')); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success || !json?.data?.accessToken) {
        const message = json?.error?.th ?? json?.error?.en ?? json?.error ?? 'Login failed'
        setError(typeof message === 'string' ? message : 'Login failed')
        return
      }

      localStorage.setItem('access_token', json.data.accessToken)
      if (json.data.refreshToken) localStorage.setItem('refresh_token', json.data.refreshToken)

      const profileRes = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${json.data.accessToken}` },
      })
      const profileJson = await profileRes.json().catch(() => ({}))
      if (profileJson?.success && profileJson?.data) {
        localStorage.setItem('user_profile', JSON.stringify(profileJson.data))
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

return (
  <div className="min-h-screen flex bg-white overflow-hidden">

    {/* ── LEFT PANEL (Background Image + Welcome text) ─────── */}
    <div
      className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center p-12 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg.jpg')" }}
    >
      {/* Overlay */}
     <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

      
<div className="relative z-10 flex items-center text-center gap-3 p-12">
    
    <div>
     
<span
  className="text-[80px] font-black
 tracking-tight text-transparent bg-clip-text animate-shine
            bg-[linear-gradient(90deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.4)_25%,#ffffff_50%,rgba(255,255,255,0.4)_75%,rgba(255,255,255,0.15)_100%)]
           
             bg-[length:200%_auto]"
>
  LOCOMO
</span>

      <span className="block text-[12px] text-slate-200 font-medium tracking-widest mt-3 drop-shadow">
        EMPLOYEE TRANSPORT MANAGEMENT
      </span>
    </div>
  </div>

    </div>

    {/* ── RIGHT PANEL (Clean Form, no card) ─────────────────── */}
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 mb-3">
            <MapPin size={26} className="text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {t('login','welcomeBack')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('login','loginSubtitle')}</p>
        </div>

        {/* Demo role selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Demo Account</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleOpen(o => !o)}
              className="w-full flex items-center justify-between gap-3 border-b border-slate-200 hover:border-sky-500 py-2.5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${selectedRole.color} flex items-center justify-center flex-shrink-0`}>
                  <Shield size={11} className="text-white" />
                </div>
                <span className="text-sm text-slate-900 font-medium">{selectedRole.role}</span>
                <span className="text-[11px] text-slate-400">· {selectedRole.desc}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${roleOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg overflow-hidden z-50 shadow-lg">
                {DEMO_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => selectDemo(acc, idx)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${acc.color} flex items-center justify-center flex-shrink-0`}>
                      <Shield size={11} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-900">{acc.role}</p>
                      <p className="text-[10px] text-slate-500">{acc.desc}</p>
                    </div>
                    {selectedRole.username === acc.username && (
                      <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <User size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder={t('login','usernamePlaceholder')}
                className="w-full bg-transparent border-b border-slate-200 focus:border-sky-500 pl-7 pr-2 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button type="button" className="text-[11px] text-sky-600 hover:text-sky-700 font-medium">
                {t('login','forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder={t('login','passwordPlaceholder')}
                className="w-full bg-transparent border-b border-slate-200 focus:border-sky-500 pl-7 pr-8 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              onClick={() => setRemember(v => !v)}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                remember
                  ? 'bg-sky-500 border-sky-500'
                  : 'bg-white border-slate-300 group-hover:border-slate-400'
              }`}
            >
              {remember && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-xs text-slate-600">{t('login','rememberMe')}</span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl py-3 transition-all shadow-md shadow-sky-500/25 hover:shadow-sky-500/40"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('login','signingIn')}</span>
              </>
            ) : (
              <>
                <span>{t('login','signIn')}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <Shield size={11} className="text-slate-400" />
          <p className="text-[10px] text-slate-400 text-center">
            Protected by enterprise security · SOC 2 compliant
          </p>
        </div>
      </div>
    </div>
  </div>
)
}
