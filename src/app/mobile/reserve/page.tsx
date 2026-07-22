'use client'

import { useMemo, useState } from 'react'
import {
  Menu,
  Check,
  Calendar as CalendarIcon,
  Sun,
  Pencil,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import CalendarDialog from '@/components/modals/CalendarDialog'
import { mockHistory, toExistingBookings } from '@/lib/mockData'
import { useRouter } from 'next/navigation'
import EditRouteDialog from '@/components/modals/EditRouteDialog'


type BookingType = 'normal' | 'ot'
type RouteType = 'round' | 'oneway'


type Direction = 'in' | 'out'

interface Shift {
  id: string
  time: string       
  direction: Direction
}

// รอบไป-กลับ
const roundShifts: Shift[] = [
  { id: 'r1', time: '8.00 - 17.00', direction: 'in' },
  { id: 'r2', time: '7.00 - 16.00', direction: 'in' },
  { id: 'r3', time: '9.00 - 18.00', direction: 'in' },
  { id: 'r4', time: '7.00 - 16.00', direction: 'in' },
  { id: 'r5', time: '9.00 - 18.00', direction: 'in' },
]

// รอบขาเดียว
const onewayShifts: Shift[] = [
  { id: 'in-08',  time: '08:00', direction: 'in'  },
  { id: 'in-20',  time: '20:00', direction: 'in'  },
  { id: 'out-17', time: '17:00', direction: 'out' },
  { id: 'out-19', time: '19:00', direction: 'out' },
  { id: 'out-05', time: '05:00', direction: 'out' },
  { id: 'out-07', time: '07:00', direction: 'out' },
]

export default function ReservePage() {
  const openMenu = useUIStore((s) => s.openMenu)
  const router = useRouter() 
  const [bookingType, setBookingType] = useState<BookingType>('normal')
  const [routeType, setRouteType] = useState<RouteType>('round')
  const [shiftId, setShiftId] = useState('1')
  const [note, setNote] = useState('')

  // Date range
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 4, 3))
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 4, 3))
  const [calendarOpen, setCalendarOpen] = useState<'start' | 'end' | null>(null)


// เลือก shifts ตาม routeType
const currentShifts = routeType === 'round' ? roundShifts : onewayShifts

// หา direction ที่เลือกอยู่
const selectedShift = currentShifts.find((s) => s.id === shiftId)
const selectedDirection = selectedShift?.direction

  const formatDate = (d: Date) => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`
  }

  const dayOfWeek = (d: Date) => {
    const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ',
      'วันพฤหัสฯ', 'วันศุกร์', 'วันเสาร์']
    return days[d.getDay()]
  }

  
  const existingBookings = useMemo(
    () => toExistingBookings(mockHistory),
    [],
  )


 const handleSave = () => {
    // TODO: เรียก API บันทึกจริง เช่น
    // await fetch('/api/bookings', { method: 'POST', body: JSON.stringify({...}) })

    console.log('บันทึก:', {
      bookingType,
      routeType,
      shiftId,
      startDate,
      endDate,
      note,
    })

    router.push('/mobile/history')             // ไปหน้า history
  }

  const handleCancel = () => {
    router.back()                              // กลับหน้าเดิม
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="rounded-b-[40px] bg-gradient-to-b from-blue-500 to-blue-600 px-5 pb-16 pt-12">
        <div className="relative flex items-center justify-center">
          <h1 className="text-xl font-bold text-white">จองรถ</h1>
          <button
            type="button"
            onClick={openMenu}
            aria-label="Menu"
            className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-8 space-y-5 px-5">
        {/* Card ครอบทุก section */}
        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-6">
          {/* ─── เลือกประเภทการจอง ─── */}
          <section>
            <h2 className="mb-3 text-sm font-bold text-slate-800">
              เลือกประเภทการจอง
            </h2>
            <div className="grid grid-cols-2 gap-3">

              <SelectCard
                selected={routeType === 'round'}
                onClick={() => setRouteType('round')}
                label="จองรถไป-กลับ"
              />
              <SelectCard
                selected={routeType === 'oneway'}
                onClick={() => setRouteType('oneway')}
                label="จองรถขาเดียว"
              />
         

            </div>
          </section>

          {/* ─── เลือกวันที่ ─── */}
          <section>
            <h2 className="mb-3 text-sm font-bold text-slate-800">
              เลือกวันที่เดินทาง
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <DateCard
                label="วันที่เริ่มต้น"
                date={formatDate(startDate)}
                day={dayOfWeek(startDate)}
                onClick={() => setCalendarOpen('start')}
              />
              <DateCard
                label="วันที่สิ้นสุด"
                date={formatDate(endDate)}
                day={dayOfWeek(endDate)}
                onClick={() => setCalendarOpen('end')}
              />
            </div>
          </section>

          {/* ─── เลือกเส้นทาง ─── */}
          <section>
            <h2 className="mb-3 text-sm font-bold text-slate-800">
              เลือกเส้นทาง
            </h2>
       

           
{/* Shifts */}

<div className="mt-3 grid grid-cols-3 gap-3">
  {currentShifts.map((s) => (
    <ShiftCard
      key={s.id}
      selected={shiftId === s.id}
      onClick={() => setShiftId(s.id)}
      time={s.time}
      direction={s.direction}
      routeType={routeType}
    />
  ))}
</div>


          </section>
        </div>

       
{/* รับเข้า */}
{(routeType === 'round' || selectedDirection === 'in') && (
  <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
    <RouteField
      title="สายรถ"
      subTitle="รับเข้า"
      subColor="text-orange-500"
      code="A01"
      codeColor="bg-blue-500"
      value="ตลาดน้ำแพร่ - โรงงาน"
    />
    <RouteField
      title="จุดรับส่ง"
      subTitle="รับเข้า"
      subColor="text-orange-500"
      codeColor="bg-blue-500"
      value="หน้าตลาดน้ำ"
    />
  </div>
)}

{/* รับออก */}
{(routeType === 'round' || selectedDirection === 'out') && (
  <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
    <RouteField
      title="สายรถ"
      subTitle="รับออก"
      subColor="text-orange-500"
      code="A01"
      codeColor="bg-orange-400"
      value="ตลาดน้ำแพร่ - โรงงาน"
    />
    <RouteField
      title="จุดรับส่ง"
      subTitle="รับออก"
      subColor="text-orange-500"
      codeColor="bg-orange-400"
      value="หน้าตลาดน้ำ"
    />
  </div>
)}


        {/* ─── หมายเหตุ ─── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              หมายเหตุ (ถ้ามี)
            </h2>
          
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="โปรดระบุรายละเอียดเพิ่มเติม"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* ─── ปุ่ม ─── */}
        <div className="space-y-3">
          <button
            type="button"
            className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
            onClick={handleSave}  
          >
            บันทึก
          </button>
          <button
            type="button"
              onClick={handleCancel}      
            className="w-full rounded-2xl bg-orange-500 py-3.5 font-bold text-white shadow-md transition hover:bg-orange-600 active:scale-[0.98]"
          >
            ยกเลิก
          </button>
        </div>
      </div>
 
      {/* Calendar Dialog */}
      {calendarOpen && (
        <CalendarDialog
          startDate={startDate}
          endDate={endDate}
           existingBookings={existingBookings}
          onClose={() => setCalendarOpen(null)}
          onConfirm={(s, e) => {
            setStartDate(s)
            setEndDate(e)
            setCalendarOpen(null)
          }}
        />
      )}
    </div>
  )
}

/* ─── Sub Components ─── */

function SelectCard({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-slate-200 text-slate-500'
      }`}
    >
      {selected && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
          <Check size={12} className="text-white" strokeWidth={3} />
        </span>
      )}
      {label}
    </button>
  )
}

function DateCard({
  label,
  date,
  day,
  onClick,
}: {
  label: string
  date: string
  day: string
  onClick: () => void
}) {
 
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-left transition hover:border-blue-400"
    >
      
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
        <CalendarIcon size={16} className="text-white" />
      </div>

      <div className="flex-1 leading-tight space-y-1">
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-[13px] font-bold text-slate-800">{date}</p>
        <p className="text-[11px] text-slate-500">{day}</p>
      </div>
    </button>
  )
}


function ShiftCard({
  selected,
  onClick,
  time,
  direction,
  routeType,
}: {
  selected: boolean
  onClick: () => void
  time: string
  direction: Direction
  routeType: RouteType
}) {

  const topText =
    routeType === 'round'
      ? 'ไป-กลับ'
      : direction === 'in'
        ? 'รับเข้า'
        : 'รับออก'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
      }`}
    >
      {selected && (
        <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
          <Check size={12} className="text-white" strokeWidth={3} />
        </span>
      )}
      <Sun size={22} className="text-amber-400" />
      <p className="text-[11px] font-semibold text-slate-600">
        {topText}
      </p>
      <p className="text-[11px] text-slate-500">
        {time}
      </p>
    </button>
  )
}

function RouteField({
  title,
  subTitle,
  subColor,
  code,
  codeColor,
  value,
}: {
  title: string
  subTitle: string
  subColor: string
  code?: string
  codeColor: string
  value: string
}) {

   const [editOpen, setEditOpen] = useState(false)

       const handleSaveRoute = (data: any) => {
    console.log('บันทึก:', data)
    setEditOpen(false)
    // TODO: เรียก API อัปเดต
  }
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
        {title}
        <span className={subColor}>{subTitle}</span>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${codeColor}`}
        >
          <Check size={14} className="text-white" strokeWidth={3} />
        </span>
        {code && (
          <>
            <span className="text-sm font-bold text-slate-800">{code}</span>
            <span className="text-slate-300">|</span>
          </>
        )}
        <span className="flex-1 text-sm text-slate-600">{value}</span>
        <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50"
      >
        <Pencil size={18} />
      </button>

        {/* Dialog */}
            {editOpen && (
              <EditRouteDialog
                user={{
                  name: 'สมชาย ใจดี',
                  empCode: 'EMP10245',
                }}
                initialData={{
                  tripIn:  { routeId: 'r1', pickup: 'หน้าโรงงาน' },
                  tripOut: { routeId: 'r1', pickup: 'หน้าโรงงาน' },
                }}
             
                onClose={() => setEditOpen(false)}
                onSave={handleSaveRoute}
              />
            )}
      </div>
    </div>
  )
}