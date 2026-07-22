'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Menu,
  Clock,
  Bus,
  MapPin,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { mockRoutes } from '@/lib/mockData'

export default function TrackingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const route = mockRoutes.find((r) => r.id === id)
   const openMenu = useUIStore((s) => s.openMenu)

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">ไม่พบข้อมูล</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 font-semibold text-sm"
          >
            ← กลับ
          </button>
        </div>
      </div>
    )
  }

  const handleCancel = () => {
    console.log('ยกเลิกการจอง:', route.id)
    router.back()
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-blue-500 to-blue-600 rounded-b-[40px] px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="text-white text-lg font-bold">ติดตามรถ</h1>
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

      {/* Map */}
      <div className="px-5 -mt-2">
        <div className="relative h-56 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />

          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 224"
            preserveAspectRatio="none"
          >
            <line
              x1="60"
              y1="150"
              x2="280"
              y2="150"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute" style={{ left: '13%', top: '58%' }}>
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-md flex items-center justify-center">
              <MapPin size={12} className="text-white" fill="white" />
            </div>
          </div>

          <div
            className="absolute transition-all"
            style={{
              left: `${13 + (route.progress / 100) * 55}%`,
              top: '55%',
            }}
          >
            <div className="w-9 h-9 rounded-full bg-white border-2 border-blue-500 shadow-md flex items-center justify-center animate-pulse">
              <Bus size={16} className="text-blue-600" />
            </div>
          </div>

          <div className="absolute" style={{ right: '25%', top: '58%' }}>
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-md flex items-center justify-center">
              <MapPin size={12} className="text-white" fill="white" />
            </div>
          </div>
        </div>

        {/* ETA Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">
              รถกำลังจะมาเวลา {route.etaTime} น. ({route.etaMinutes} นาที)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              โปรดเตรียมตัว ณ จุดขึ้นรถก่อนเวลา 5 นาที
            </p>
          </div>
        </div>
      </div>

      {/* รายละเอียดการจอง */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-bold text-slate-800 mb-3">รายละเอียดการจอง</h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <DetailRow label="สาย" value={`${route.routeCode} ${route.routeName}`} />
          <DetailRow label="ประเภทการเดินทาง" value={route.tripType} />
          <DetailRow label="วันที่จอง" value={route.bookingDate} />
          <DetailRow label="เวลา" value={route.bookingTime} isLast />
        </div>
      </div>

      {/* รถคันที่ */}
      <div className="px-5 mt-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">
              รถคันที่ {route.vehicleNo}
            </h3>
            <p className="text-slate-600 mt-1">{route.vehicleName}</p>
            <p className="text-slate-600">{route.plateNo}</p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-32 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
              <Bus size={40} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* คนขับ */}
      <div className="px-5 mt-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {route.driver.charAt(0)}
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">{route.driver}</p>
            <p className="text-sm text-slate-500 font-mono">{route.phone}</p>
          </div>
        </div>
      </div>

      {/* ยกเลิกการจอง */}
      <div className="px-5 mt-8">
        <button
          onClick={handleCancel}
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-4 font-bold text-base transition-colors shadow-md"
        >
          ยกเลิกการจอง
        </button>
      </div>
    </div>
  )
}

/* ═══════ Detail Row ═══════ */
function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string
  value: string
  isLast?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 ${
        !isLast ? 'border-b border-slate-100' : ''
      }`}
    >
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right">
        {value}
      </span>
    </div>
  )
}