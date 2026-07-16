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
  const [localError, setLocalError] = useState('')

  // ── ตอน mount → load profile จาก localStorage ──
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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
      router.push('/mobile')
    }
    // ถ้าไม่ success → error ถูก set ใน store แล้ว
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 mx-auto flex items-center justify-center shadow-xl shadow-sky-200">
            <Bus size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mt-4 tracking-tight">LOCOMO</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">แอปพลิเคชันสำหรับพนักงาน</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-sky-100/50 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">เข้าสู่ระบบ</h2>
            <p className="text-xs text-slate-500 mt-1">กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">ชื่อผู้ใช้</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="รหัสพนักงาน / อีเมล"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white outline-none text-sm transition-all"
                value={username}
                onChange={e => {
                  setUsername(e.target.value)
                  setLocalError('')
                }}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">รหัสผ่าน</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="รหัสผ่าน"
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white outline-none text-sm transition-all"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setLocalError('')
                }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {displayError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1">{displayError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={isLoading || !username || !password}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg shadow-sky-200 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          © 2026 LOCOMO Transport Management
        </p>
      </div>
    </div>
  )
}