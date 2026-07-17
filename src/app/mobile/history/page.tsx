'use client'

import { useState } from 'react'
import { MapPin, Calendar, User, CheckCircle2, Clock, XCircle,Menu } from 'lucide-react'
import BookingDialog from '@/components/modals/BookingDialog'
import { useUIStore } from '@/lib/store'

type TabType = 'pending' | 'approved' | 'cancelled'

/* ═══════ Mock Data ═══════ */
const mockHistory = [
  {
    id: 'B001',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 15 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'approved' as TabType,
    
bookingDate: '15/05/69',
    bookingTime: '09:45 น.',

  },
  {
    id: 'B002',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 15 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'approved' as TabType,
    
bookingDate: '15/05/69',
    bookingTime: '09:45 น.',

  },
  {
    id: 'B003',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 15 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'approved' as TabType,
    
bookingDate: '15/05/69',
    bookingTime: '09:45 น.',

  },
  {
    id: 'B004',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 15 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'pending' as TabType,
    
bookingDate: '15/05/69',
    bookingTime: '09:45 น.',

  },
  {
    id: 'B005',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 15 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'cancelled' as TabType,
    
bookingDate: '15/05/69',
    bookingTime: '09:45 น.',

  },
]

export default function HistoryPage() {
  const [tab, setTab] = useState<TabType>('approved')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = mockHistory.filter((h) => h.status === tab)
  const selectedBooking = mockHistory.find((h) => h.id === selectedId)
    const openMenu = useUIStore((s) => s.openMenu)

return (
  <div className="min-h-screen bg-slate-50 pb-32">
    {/* Header */}
    <div className="rounded-b-[40px] bg-gradient-to-b from-blue-500 to-blue-600 px-5 pb-16 pt-12">
      {/* Row: Title กลาง + ปุ่ม Menu ขวา */}
      <div className="relative flex items-center justify-center">
        <h1 className="text-xl font-bold text-white">
          ประวัติการจอง
        </h1>

        <button
          type="button"
          onClick={openMenu}
          aria-label="Menu"
          className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex items-center rounded-full bg-white p-1.5 shadow-md">
        <TabButton
          label="รออนุมัติ"
          active={tab === 'pending'}
          onClick={() => setTab('pending')}
        />
        <TabButton
          label="อนุมัติแล้ว"
          active={tab === 'approved'}
          onClick={() => setTab('approved')}
        />
        <TabButton
          label="ยกเลิก"
          active={tab === 'cancelled'}
          onClick={() => setTab('cancelled')}
        />
      </div>
    </div>

    {/* Card List */}
    <div className="mt-6 space-y-3 px-5">
      {filtered.map((item) => (
        <BookingCard
          key={item.id}
          item={item}
          onClick={() => setSelectedId(item.id)}
        />
      ))}

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">
            ไม่พบข้อมูล
          </p>
        </div>
      )}
    </div>

    {/* Booking Dialog */}
    {selectedBooking && (
      <BookingDialog
        booking={selectedBooking}
        onClose={() => setSelectedId(null)}
      />
    )}
  </div>
)

}

/* ═══════ Tab Button ═══════ */
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
        active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}

/* ═══════ Booking Card ═══════ */
function BookingCard({
  item,
  onClick,
}: {
  item: (typeof mockHistory)[0]
  onClick?: () => void
}) {
  const statusConfig = {
    pending: {
      label: 'รออนุมัติ',
      icon: <Clock size={12} />,
      className: 'bg-amber-100 text-amber-700',
    },
    approved: {
      label: 'อนุมัติแล้ว',
      icon: <CheckCircle2 size={12} />,
      className: 'bg-green-100 text-green-700',
    },
    cancelled: {
      label: 'ยกเลิก',
      icon: <XCircle size={12} />,
      className: 'bg-red-100 text-red-600',
    },
  }

  const status = statusConfig[item.status]

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md active:scale-[0.99] transition-all"
    >
      {/* Header: สาย + Status */}
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-blue-600">สาย {item.routeCode}</p>
        <span
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${status.className}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mt-2">
        <MapPin size={18} className="text-slate-700 flex-shrink-0" />
        <p className="text-base font-bold text-slate-800">{item.from}</p>
        <span className="text-slate-400">→</span>
        <p className="text-base font-bold text-slate-800">{item.to}</p>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 mt-2 text-slate-600">
        <Calendar size={16} className="flex-shrink-0" />
        <p className="text-sm">
          {item.date} <span className="ml-2">{item.time}</span>
        </p>
      </div>

      {/* Employee */}
      <div className="flex items-center gap-2 mt-1.5 text-slate-600">
        <User size={16} className="flex-shrink-0" />
        <p className="text-sm">
          {item.empCode} {item.empName}
        </p>
      </div>
    </button>
  )
}