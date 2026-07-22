'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Menu,
  Bus,
  MapPin,
  Navigation,
  ChevronRight,
  Search,
} from 'lucide-react'

import { useUIStore } from '@/lib/store'
import { mockRoutes } from '@/lib/mockData'



export default function TrackingPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
   const openMenu = useUIStore((s) => s.openMenu)

  const filteredRoutes = mockRoutes.filter((r) =>
    `${r.routeCode} ${r.routeName}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
 <div
  className="relative rounded-b-[40px] px-7 pt-12 pb-16 overflow-hidden bg-cover bg-center"
  style={{ backgroundImage: "url('/images/bg.jpg')" }}
>
 
  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />


     
<div className="flex items-start justify-between  relative  z-10">
        {/* ซ้าย: Title */}
        <div>
          <h1 className="text-xl font-bold text-white">
            ติดตามรถ
          </h1>
          <p className="mt-1 text-xs text-white/80">
            แสดงตำแหน่งรถแบบเรียลไทม์
          </p>
        </div>

        {/* ขวา: ปุ่ม Hamburger */}
        <button
          type="button"
          onClick={openMenu}
          aria-label="Menu"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </div>
    </div>


      

   
    


      {/* Search */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md px-5 py-3.5 border border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาสายรถ / เส้นทาง"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <StatCard label="รถทั้งหมด" value="15" color="blue" icon={<Bus size={18} />} />
        <StatCard label="กำลังวิ่ง" value="8" color="green" icon={<Navigation size={18} />} />
      </div>

      {/* Route List */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-bold text-slate-800 mb-3">รายการรถวันนี้</h2>

        <div className="space-y-3">
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onClick={() => router.push(`/mobile/tracking/${route.id}`)}
            />
          ))}

          {filteredRoutes.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
              <p className="text-sm text-slate-400">ไม่พบข้อมูล</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════ Stat Card ═══════ */
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: string
  color: 'blue' | 'green'
  icon: React.ReactNode
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

/* ═══════ Route Card ═══════ */
function RouteCard({
  route,
  onClick,
}: {
  route: (typeof mockRoutes)[0]
  onClick?: () => void
}) {
  const isOnRoute = route.status === 'on-route'

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
            isOnRoute ? 'bg-blue-500' : 'bg-slate-400'
          }`}
        >
          {route.routeCode}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-800 leading-tight">
            {route.routeName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnRoute ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <p className="text-xs text-slate-500">
              {isOnRoute ? `กำลังวิ่ง · ${route.currentStop}` : 'ยังไม่ออก'}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 flex-shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-slate-200">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-slate-400">
            <MapPin size={11} />
            <span className="text-[10px]">ต้นทาง</span>
          </div>
          <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">
            {route.from}
          </p>
          <p className="text-sm font-bold text-blue-600 mt-0.5">{route.startTime}</p>
        </div>

        <div className="flex-shrink-0 text-slate-300">→</div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-1 text-slate-400">
            <span className="text-[10px]">ปลายทาง</span>
            <MapPin size={11} />
          </div>
          <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">
            {route.to}
          </p>
          <p className="text-sm font-bold text-blue-600 mt-0.5">{route.endTime}</p>
        </div>
      </div>

      {isOnRoute && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${route.progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right">
            เดินทาง {route.progress}%
          </p>
        </div>
      )}
    </button>
  )
}
