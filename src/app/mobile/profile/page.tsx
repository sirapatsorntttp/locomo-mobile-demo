'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User, Settings, Globe, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'

export default function ProfilePage() {
  const router = useRouter()
  const { profile, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 rounded-b-[40px] px-5 pt-12 pb-16">
        <h1 className="text-white text-xl font-bold">Profile</h1>
        <p className="text-white/80 text-xs mt-1">ข้อมูลส่วนตัวของคุณ</p>
      </div>

      {/* Profile Card */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-5 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
            {profile?.firstName?.charAt(0) ?? 'U'}
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-800">
            คุณ{profile?.firstName ?? '-'} {profile?.lastName ?? ''}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {profile?.code ?? '-'}
          </p>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-5 mt-6 space-y-2">
        <MenuItem icon={<User size={18} />} label="ข้อมูลส่วนตัว" />
        <MenuItem icon={<Settings size={18} />} label="ตั้งค่า" />
        <MenuItem icon={<Globe size={18} />} label="เปลี่ยนภาษา" />
      </div>

      {/* Logout Button */}
      <div className="px-5 mt-6">
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl p-3.5 flex items-center justify-center gap-2 font-semibold transition-colors"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}

/* ═══════ Menu Item Component ═══════ */
function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <span className="flex-1 text-left text-sm font-semibold text-slate-800">
        {label}
      </span>
      <ChevronRight size={16} className="text-slate-400" />
    </button>
  )
}