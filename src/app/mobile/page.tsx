// src/app/mobile/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'

export default function MobileHome() {
  const router = useRouter()
  const { profile, isAuthenticated, loadProfile, logout } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    loadProfile()
    setChecked(true)
  }, [loadProfile])

  useEffect(() => {
    if (checked && !isAuthenticated) {
      router.replace('/login')
    }
  }, [checked, isAuthenticated, router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (!checked || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-3xl p-5">
          <p className="text-xs opacity-90">ยินดีต้อนรับ</p>
          <h1 className="text-xl font-bold mt-1">
            คุณ{profile?.firstName ?? '-'} {profile?.lastName ?? ''}
          </h1>
          <p className="text-xs opacity-80 mt-1 font-mono">
            {profile?.code ?? '-'}
          </p>
        </div>

        {/* Roles */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-2">Roles</h2>
          <div className="flex flex-wrap gap-1">
            {profile?.roleTypes.map(r => (
              <span
                key={r}
                className="text-[10px] bg-sky-100 text-sky-700 px-2 py-1 rounded-lg font-semibold"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Company info */}
        {profile?.companyName && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 mb-2">บริษัท</h2>
            <p className="text-sm text-slate-600">{profile.companyName}</p>
            <p className="text-xs text-slate-400 font-mono">
              {profile.companyCode}
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl p-3 flex items-center justify-center gap-2 font-semibold transition-colors"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>

        <p className="text-center text-xs text-slate-400">
          ✅ Login สำเร็จ - หน้า mobile กำลังพัฒนา
        </p>
      </div>
    </div>
  )
}