'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu,
  Search,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import FeedbackDialog from '@/components/modals/commentDialog'
import CalendarDialog from '@/components/modals/CalendarDialog'
/* ─── Types ─── */
export interface FeedbackItem {
  id: string
  code: string           // A01-xxxxxx
  routeName: string      // สายบ้านโพธิ์ - โรงงาน (A01)
  title: string          // รถขับเร็วมาก
  detail: string
  date: string           // 'พฤหัสบดี 16 พ.ค. 2569'
  time: string           // '06:20 น.'
  avatar?: string
}

/* ─── Mock ─── */
const mockFeedback: FeedbackItem[] = [
  {
    id: 'f1',
    code: 'A01-xxxxxx',
    routeName: 'สายบ้านโพธิ์ - โรงงาน (A01)',
    title: 'รถขับเร็วมาก',
    detail: 'รถมาสาย ทำให้ถึงช้า',
    date: 'พฤหัสบดี 16 พ.ค. 2569',
    time: '06:20 น.',
  },
  {
    id: 'f2',
    code: 'A01-xxxxxx',
    routeName: 'สายบ้านโพธิ์ - โรงงาน (A01)',
    title: 'รถขับเร็วมาก',
    detail: 'รถมาสาย ทำให้ถึงช้า',
    date: 'พฤหัสบดี 16 พ.ค. 2569',
    time: '06:20 น.',
  },
]

export default function FeedbackPage() {
  const router = useRouter()
  const openMenu = useUIStore((s) => s.openMenu)

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [startDate, setStartDate] = useState<Date>(new Date(2026, 4, 3))
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 4, 3))
  const [calendarOpen, setCalendarOpen] = useState(false)


  const selected = mockFeedback.find((f) => f.id === selectedId) ?? null

  const filtered = mockFeedback.filter(
    (f) =>
      f.title.includes(search) ||
      f.routeName.includes(search) ||
      f.code.includes(search),
  )

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

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="rounded-b-[40px] bg-gradient-to-b from-blue-500 to-blue-600 px-5 pb-16 pt-12">
        <div className="relative flex items-center justify-center">
          <h1 className="text-xl font-bold text-white">
            รายงานข้อเสนอแนะ
          </h1>
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
      <div className="-mt-10 space-y-4 px-5">
        {/* Date Range */}
       
 <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <DateCard
            label="วันที่เริ่มต้น"
            date={formatDate(startDate)}
            day={dayOfWeek(startDate)}
            onClick={() => setCalendarOpen(true)}
          />
          <DateCard
            label="วันที่สิ้นสุด"
               onClick={() => setCalendarOpen(true)}
            date={formatDate(endDate)}
            day={dayOfWeek(endDate)}
         
          />
        </div>


        {/* Search + Filter */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
          
        </div>

        {/* Section title + dropdown */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-800">
            รายงานของฉัน
          </h2>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-slate-500"
          >
            ทั้งหมด
            <ChevronDown size={14} />
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onClick={() => setSelectedId(item.id)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
              <p className="text-sm text-slate-400">ไม่มีข้อมูล</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB Add */}
<button
  type="button"
  onClick={() => router.push('/mobile/comment/new')}
  aria-label="เพิ่มข้อเสนอแนะ"
  className="fixed bottom-28 left-5 right-5 z-30 flex items-center justify-center gap-2 rounded-full  bg-amber-500 py-2 font-bold text-white shadow-lg transition hover:bg-orange-600 active:scale-[0.98]"
>
  <Plus size={20} strokeWidth={2} />
  <span className="text-base">New</span>
</button>

      {/* Detail Dialog */}
      {selected && (
        <FeedbackDialog
          item={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
   

   
{/* alendar Dialog —  */}
      {calendarOpen && (
        <CalendarDialog
          startDate={startDate}
          endDate={endDate}
          onClose={() => setCalendarOpen(false)}
          onConfirm={(s, e) => {
            setStartDate(s)
            setEndDate(e)
            setCalendarOpen(false)
          }}
        />
      )}
    </div>

  )
}

/* ─── Sub Components ─── */
function DateCard({
  label,
  date,
  day,
    onClick,
}: {
  label: string
  date: string
  day: string
    onClick?: () => void 
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


function FeedbackCard({
  item,
  onClick,
}: {
  item: FeedbackItem
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
    >
      {/* Avatar placeholder */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-200" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{item.title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {item.routeName}
        </p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <CalendarIcon size={11} />
          <span>
            {item.date} | {item.time}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-blue-500">
          {item.code}
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  )
}