// src/app/mobile/home/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Menu,
  Search,
  CarFront,
  Clock,
  MessageSquareWarning,
  Phone,
  PhoneCall,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'

import { useUIStore } from '@/lib/store'

export default function MobileHome() {
  const router = useRouter()
  const { profile, isAuthenticated, loadProfile } = useAuthStore()
  const [checked, setChecked] = useState(false)
  const openMenu = useUIStore((s) => s.openMenu)

  useEffect(() => {
    loadProfile()
    setChecked(true)
  }, [loadProfile])

  useEffect(() => {
    if (checked && !isAuthenticated) {
      router.replace('/login')
    }
  }, [checked, isAuthenticated, router])

  if (!checked || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ─── Header (Blue Curve) ──────────────────── */}
      <div className="relative bg-gradient-to-b from-blue-500 to-blue-600 rounded-b-[40px] px-5 pt-12 pb-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full border-2 border-white/40 bg-white/20 overflow-hidden flex items-center justify-center text-white font-bold text-lg">
              {profile?.firstName?.charAt(0) ?? 'U'}
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">
                Hello, {profile?.firstName ?? 'User'}
              </p>
              <p className="text-white/80 text-xs mt-0.5">Welcome To LOCOMO</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
           
 <button
      type="button"
      onClick={() => router.push('/mobile/notify')}
      aria-label="แจ้งเตือน"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 active:scale-95"
    >
      <Bell size={18} className="text-slate-700" />
    </button>

            <button 
            type='button'
          onClick={openMenu}
            aria-label='Menu'
            className="w-10 h-10 rounded-full flex items-center justify-center text-white">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>



      {/* ─── Search Bar (ทับส่วนโค้ง) ─────────────── */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md px-5 py-3.5 border border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ─── เมนูหลัก ─────────────────────────────── */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-bold text-slate-800 mb-3">เมนูหลัก</h2>
        <div className="grid grid-cols-2 gap-3">
          <MenuCard
            icon={<CarFront className="text-blue-600" size={40} strokeWidth={1.8} />}
            label="จองรถ"
            onClick={() => router.push('/mobile/reserve')}
          />
          <MenuCard
            icon={<Clock className="text-blue-600" size={40} strokeWidth={1.8} />}
            label="ประวัติการจอง"
            onClick={() => router.push('/mobile/history')}
          />
          <MenuCard
            icon={
              <MessageSquareWarning
                className="text-blue-600"
                size={40}
                strokeWidth={1.8}
              />
            }
            label="รายงานข้อเสนอแนะ"
            onClick={() => router.push('/mobile/comment')}
          />
          <MenuCard
            icon={<Phone className="text-blue-600" size={40} strokeWidth={1.8} />}
            label="ติดต่อเรา"
            onClick={() => router.push('/mobile/contact')}
          />
        </div>
      </div>

      {/* ─── การเดินทางของคุณ ─────────────────────── */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800">การเดินทางของคุณ</h2>
          <button className="text-xs text-blue-600 font-semibold">
            ดูทั้งหมด
          </button>
        </div>

        {/* Trip Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              A01
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">10 มิถุนายน 2569</p>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                ตลาดบ้านโพธิ์
              </h3>
            </div>
            <span className="text-xs text-blue-600 font-semibold whitespace-nowrap">
              รับเข้า
            </span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-slate-400 mb-1">ต้นทาง</p>
              <p className="text-base font-bold text-blue-600 mb-1.5">07:20</p>
              <div className="bg-slate-100 rounded-full px-2 py-1">
                <p className="text-[10px] text-slate-700 font-medium truncate">
                  หน้าหมู่บ้านโคโนฮะ
                </p>
              </div>
            </div>

            <ArrowRight size={16} className="text-slate-400 flex-shrink-0 mt-4" />

            <div className="flex-1 text-center">
              <p className="text-[10px] text-slate-400 mb-1">ปลายทาง</p>
              <p className="text-base font-bold text-blue-600 mb-1.5">08:15</p>
              <div className="bg-slate-800 rounded-full px-2 py-1">
                <p className="text-[10px] text-white font-medium truncate">
                  โรงงาน
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 my-4" />

          {/* Driver */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <PhoneCall size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">พี่สมชาย ใจดี</p>
              <p className="text-[10px] text-slate-400 font-mono">
                081-xxx-xxxx • BUS01 • 30-4040
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════ Menu Card Component ═══════ */
function MenuCard({
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
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all p-5 flex flex-col items-center justify-center gap-3 aspect-[4/3]"
    >
      {icon}
      <p className="text-sm font-bold text-slate-800">{label}</p>
    </button>
  )
}
