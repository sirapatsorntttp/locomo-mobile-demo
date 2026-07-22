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
  MoveRight,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'

import { useUIStore } from '@/lib/store'
import { mockRoutes } from '@/lib/mockData'

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


    const route  = mockRoutes[0]

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
<div
  className="relative rounded-b-[40px] px-5 pt-12 pb-16 overflow-hidden bg-cover bg-center"
  style={{ backgroundImage: "url('/images/bg.jpg')" }}
>
 
  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

  
  <div className="relative z-10">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full border-2 border-white/40 bg-white/20 overflow-hidden flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
          {profile?.firstName?.charAt(0) ?? 'U'}
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight drop-shadow-md">
            Hello, {profile?.firstName ?? 'User'}
          </p>
          <p className="text-white/90 text-xs mt-0.5 drop-shadow">
            Welcome To LOCOMO
          </p>
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
          type="button"
          onClick={openMenu}
          aria-label="Menu"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
        >
          <Menu size={22} />
        </button>
      </div>
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
        <div className="grid grid-cols-2 gap-3 ">
          <MenuCard
            icon={<CarFront className="text-blue-600 " size={35} strokeWidth={1.8} />}
            label="จองรถ"
            onClick={() => router.push('/mobile/reserve')}
          />
          <MenuCard
            icon={<Clock className="text-blue-600" size={35} strokeWidth={1.8} />}
            label="ประวัติการจอง"
            onClick={() => router.push('/mobile/history')}
          />
          <MenuCard
            icon={
              <MessageSquareWarning
                className="text-blue-600"
                size={35}
                strokeWidth={1.8}
              />
            }
            label="รายงานข้อเสนอแนะ"
            onClick={() => router.push('/mobile/comment')}
          />
          <MenuCard
            icon={<Phone className="text-blue-600" size={35} strokeWidth={1.8} />}
            label="ติดต่อเรา"
            onClick={() => router.push('/mobile/contact')}
          />
        </div>
      </div>

      {/* ─── การเดินทางของคุณ ─────────────────────── */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800">การเดินทางของคุณ</h2>
        
  <button
          onClick={() => router.push('/mobile/tracking')}
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          ทั้งหมด
        </button>

        </div>

        {/* Trip Card */}
        <div   onClick={() => router.push(`/mobile/tracking/${route.id}`)}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4  cursor-pointer">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {route.routeCode}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">{route.bookingDate}</p>
              <h3 className="text-lg font-bold text-slate-800 leading-tight mt-1">
               {route.routeName}
              </h3>
            </div>
            <span className="text-xs text-blue-600 font-semibold whitespace-nowrap">
             {route.tripType}
            </span>
          </div>

{/* Route */}
<div className="flex items-center gap-3 mt-4">
  {/* ต้นทาง */}
  <div className="flex-1 flex justify-center">
    <div className="inline-block">
     
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10px] text-slate-400">ต้นทาง</p>
        <p className="text-[14px] font-bold text-blue-600">
          {route.startTime}
        </p>
      </div>

      {/* chip */}
      <div className="bg-[#CDD6DE] rounded-full px-3 py-1">
        <p className="text-[12px] text-center text-slate-700 font-medium truncate">
          {route.from}
        </p>
      </div>
    </div>
  </div>

 <MoveRight size={20} className="text-slate-700 flex-shrink-0" strokeWidth={2.5} />

  {/* ปลายทาง */}
  <div className="flex-1 flex justify-center">
    <div className="inline-block">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10px] text-slate-400">ปลายทาง</p>
        <p className="text-[14px] font-bold text-blue-600">
          {route.endTime}
        </p>
      </div>

      <div className="bg-[#06345C] rounded-full px-3 py-1">
        <p className="text-[12px] text-center text-white font-medium truncate">
          {route.to}
        </p>
      </div>
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
              <p className="text-sm font-bold text-slate-800">{route.driver}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {route.phone} • {route.vehicleNo} • {route.plateNo}
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
      className="bg-white rounded-2xl shadow-xl  border border-slate-200 shadow-sm hover:shadow-md active:scale-[0.98] transition-all p-3 flex flex-col items-center justify-center gap-2 aspect-[5/3]"
    >
      {icon}
      <p className="text-sm font-bold text-slate-800">{label}</p>
    </button>
  )
}
