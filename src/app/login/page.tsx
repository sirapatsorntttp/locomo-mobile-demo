// src/app/login/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bus, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, isAuthenticated, loadProfile } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const [localError, setLocalError] = useState('')

  // ── ตอน mount → load profile จาก localStorage ──
  useEffect(() => {
    loadProfile()
  }, [loadProfile])


  
// ── โหลด username ที่เคยจำไว้ ──
useEffect(() => {
  const savedUsername = localStorage.getItem('remembered_username')
  if (savedUsername) {
    setUsername(savedUsername)
    setRemember(true)
  } else {
    setRemember(false)
  }
}, [])

  // ── ถ้า login แล้ว → redirect ไป /mobile ────
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/mobile')
    }
  }, [isAuthenticated, router])

  const handleLogin = async () => {
    setLocalError('')

    if (!username || !password) {
      setLocalError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
      return
    }

    const result = await login(username, password)
    if (result.success) {


      
 if (remember) {
        localStorage.setItem('remembered_username', username)
      } else {
        localStorage.removeItem('remembered_username')
      }

      router.push('/mobile')
    }
    // ถ้าไม่ success → error ถูก set ใน store แล้ว
  }

  const displayError = localError || error

 
 return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/bg.jpg')" }}
    >
      {/* Overlay บาง ๆ ให้ตัวหนังสืออ่านง่ายขึ้น */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center px-8">
        {/* ── Logo LOCOMO ── */}
        <div className="mt-16 mb-12 text-center">
          <h1
            className="text-6xl font-black tracking-wide text-white"
            style={{
              textShadow: '0 6px 20px rgba(0,0,0,0.25)',
              letterSpacing: '0.05em',
                 WebkitTextStroke: '2px white'
            }}
          >
            LOCOMO
          </h1>

          {/* WELCOME + เส้นข้าง */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-14 bg-white/90" />
            <span className="text-sm font-medium tracking-[0.3em] text-white">
              WELCOME
            </span>
            <span className="h-px w-14 bg-white/90" />
          </div>
        </div>

        {/* ── Card Login ── */}
        <div className="w-full max-w-sm rounded-[30px] bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900">
              ยินดีต้อนรับ
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              เข้าสู่ระบบเพื่อใช้งาน LOCOMO
            </p>
          </div>

          {/* Username */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-slate-500">ชื่อผู้ใช้</span>
              <span className="text-xs tracking-widest text-slate-400">
                USERNAME
              </span>
            </div>

            <div
              className={`relative flex items-center rounded-2xl border-2 bg-white transition-all ${
                username
                  ? 'border-blue-500'
                  : 'border-slate-200 focus-within:border-blue-500'
              }`}
            >
              <User size={18} className="ml-4 text-slate-500" />
              <input
                type="text"
                placeholder="รหัสพนักงาน"
                className="flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setLocalError('')
                }}
                autoComplete="username"
              />
              {username && (
                <span className="mr-4 h-2.5 w-2.5 rounded-full bg-green-500" />
              )}
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-slate-500">รหัสผ่าน</span>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-blue-600"
              >
                ลืมรหัสผ่าน ?
              </button>
            </div>

            <div className="relative flex items-center rounded-2xl border-2 border-slate-200 bg-white focus-within:border-blue-500">
              <Lock size={18} className="ml-4 text-slate-500" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••••"
                className="flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setLocalError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="mr-4 text-slate-500 hover:text-slate-700"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="mb-5 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
            />
            <span className="text-sm text-slate-700">จดจำการเข้าสู่ระบบ</span>
          </label>

          {/* Error */}
          {displayError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1">{displayError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={isLoading || !username || !password}
            className="w-full rounded-2xl bg-[#002B5B] py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-[#0d3572] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] font-medium text-white/90 drop-shadow">
          © 2026 LOCOMO Transport Management
        </p>
      </div>
    </div>
  )
}
