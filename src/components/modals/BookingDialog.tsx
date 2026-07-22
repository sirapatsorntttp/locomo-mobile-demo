'use client'

import { useState, useEffect } from 'react'
import {
  Bus,
  Calendar,
  Navigation,
  Clock,
  Car,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { CustomSelect } from './CustomSelect'

/* ═══════ Types ═══════ */
type BookingStatus = 'pending' | 'approved' | 'cancelled'

interface Booking {
  id: string
  empCode: string
  empName: string
  status: BookingStatus
  bookingDate: string  // "15/05/69"
  bookingTime: string  // "09:45 น."
}

/* ═══════ Options ═══════ */
const dateOptions = ['15 พฤษภาคม 2569', '16 พฤษภาคม 2569', '17 พฤษภาคม 2569']
const roundOptions = ['รอบรับออก', 'รอบรับเข้า']
const timeOptions = ['07:15 น.', '07:30 น.', '08:00 น.']
const routeOptions = ['A01 ตลาดบ้านโพธิ์ - โรงงาน', 'A02 ตลาดน้ำแพร่ - โรงงาน']
const pickupOptions = ['หน้าโรงงาน', 'ตลาด', 'สถานีรถไฟ']

interface Props {
  booking: Booking
  onClose: () => void
}

export default function BookingDialog({ booking, onClose }: Props) {
  const { openDialog, closeDialog } = useUIStore()

  const [date, setDate] = useState('15 พฤษภาคม 2569')
  const [round, setRound] = useState('รอบรับออก')
  const [time, setTime] = useState('07:15 น.')
  const [route, setRoute] = useState('A01 ตลาดบ้านโพธิ์ - โรงงาน')
  const [pickup, setPickup] = useState('หน้าโรงงาน')

  // ✅ Lock BottomNav + body scroll
  useEffect(() => {
    openDialog()
    document.body.style.overflow = 'hidden'
    return () => {
      closeDialog()
      document.body.style.overflow = ''
    }
  }, [openDialog, closeDialog])

  const isPending = booking.status === 'pending'
  const isApproved = booking.status === 'approved'

  // Icon color ตามสถานะ
  const iconBgColor = isPending
    ? 'bg-amber-500'
    : isApproved
      ? 'bg-green-500'
      : 'bg-slate-400'

  const statusText = isPending
    ? { label: 'รออนุมัติ', color: 'text-amber-500' }
    : isApproved
      ? { label: 'อนุมัติแล้ว', color: 'text-green-600' }
      : { label: 'ยกเลิก', color: 'text-red-500' }

  const handleSubmit = () => {
    console.log({
      bookingId: booking.id,
      date,
      round,
      time,
      route,
      pickup,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ Header ═══ */}
        <div className="relative p-5 border-b border-slate-100">
          {/* วันที่ + เวลา มุมขวาบน */}
          <p className="absolute top-4 right-5 text-[11px] text-slate-400">
            {booking.bookingDate} {booking.bookingTime}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgColor}`}
            >
              <Bus size={26} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {booking.empName}
              </h3>
              <p className="text-xs text-slate-500">
                รหัสพนักงาน: {booking.empCode}
              </p>
              <p className="text-xs text-slate-500">
                สถานะ:{' '}
                <span className={`font-semibold ${statusText.color}`}>
                  {statusText.label}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ═══ รายละเอียด ═══ */}
        <div className="p-5">
          <h4 className="text-sm font-bold text-blue-600 mb-4">รายละเอียด</h4>

          <div className="space-y-3">
            <FieldRow
              icon={<Calendar size={18} className="text-blue-500" />}
              label="วันที่เดินทาง"
            >
              
<CustomSelect
  value={date}
  onChange={setDate}
  options={dateOptions}
/>

            </FieldRow>

            <FieldRow
              icon={<Navigation size={18} className="text-blue-500" />}
              label="รอบ"
            >
              <CustomSelect
                value={round}
                onChange={setRound}
                options={roundOptions}
              />
            </FieldRow>

            <FieldRow
              icon={<Clock size={18} className="text-blue-500" />}
              label="เวลารับ"
            >
              <CustomSelect
                value={time}
                onChange={setTime}
                options={timeOptions}
              />
            </FieldRow>

            <FieldRow
              icon={<Car size={18} className="text-blue-500" />}
              label="สายรถ"
            >
             
      <TextDisplay value={route} />

            </FieldRow>

            <FieldRow
              icon={<MapPin size={18} className="text-blue-500" />}
              label="จุดรับส่ง"
            >
            <TextDisplay value={route} />
            </FieldRow>
          </div>

          {/* ═══ Buttons ═══ */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl py-3 font-bold text-base transition-colors shadow-md"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-3 font-bold text-base transition-colors shadow-md"
            >
              {isPending ? 'ส่งคำขอ' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════ Field Row ═══════ */
function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-semibold text-slate-600">{label}</span>
      </div>
      {children}
    </div>
  )
}
/* ═══════ Text Display  ═══════ */
function TextDisplay({ value }: { value: string }) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700">
      {value}
    </div>
  )
}
