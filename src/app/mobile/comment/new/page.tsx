'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'

export default function NewFeedbackPage() {
  const router = useRouter()
  const openMenu = useUIStore((s) => s.openMenu)

  const [viewMonth, setViewMonth] = useState(11) // December
  const [viewYear, setViewYear] = useState(2022)
  const [selectedDay, setSelectedDay] = useState(22)

  const [hour, setHour] = useState('09')
  const [minute, setMinute] = useState('32')
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM')

  const [subject, setSubject] = useState('')
  const [detail, setDetail] = useState('')

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // mock dots
  const dotsDays = [8, 12, 19, 30]

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else setViewMonth(viewMonth + 1)
  }

  const handleSave = () => {
    console.log('feedback:', {
      viewMonth,
      viewYear,
      selectedDay,
      time: `${hour}:${minute} ${ampm}`,
      subject,
      detail,
    })
    router.push('/mobile/comment')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="rounded-b-[40px] bg-gradient-to-b from-blue-500 to-blue-600 px-5 pb-16 pt-12">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="ย้อนกลับ"
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <ChevronLeft size={22} />
          </button>
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
      <div className="-mt-10 space-y-5 px-5">
        {/* Route Title */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">
            สายบ้านโพธิ์ - โรงงาน (A01)
          </h2>
        </div>

        {/* Calendar + Time */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            เลือกวันที่
          </p>

          <div className="rounded-2xl border-2 border-blue-500 bg-white p-4 shadow-sm">
            {/* Month header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {monthNames[viewMonth]} {viewYear}
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day names */}
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold">
              {dayNames.map((d, i) => (
                <div
                  key={d}
                  className={
                    i === 0 || i === 6 ? 'text-red-400' : 'text-slate-500'
                  }
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dow = new Date(viewYear, viewMonth, day).getDay()
                const isSelected = day === selectedDay
                const hasDot = dotsDays.includes(day)
                const isWeekend = dow === 0 || dow === 6

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`relative flex aspect-square items-center justify-center rounded-xl text-sm transition ${
                      isSelected
                        ? 'bg-blue-600 font-bold text-white shadow-md'
                        : isWeekend
                          ? 'text-red-400 hover:bg-slate-100'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                    {hasDot && !isSelected && (
                      <span className="absolute right-1.5 top-1 h-1 w-1 rounded-full bg-green-500" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Time */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-semibold text-slate-700">
                เวลา
              </span>

              <div className="flex items-center gap-2">
                {/* Hour */}
                <input
                  type="text"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  maxLength={2}
                  className="w-10 rounded-lg bg-slate-100 py-1.5 text-center text-sm font-bold text-slate-800 outline-none"
                />
                <span className="font-bold text-slate-500">:</span>
                <input
                  type="text"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  maxLength={2}
                  className="w-10 rounded-lg bg-slate-100 py-1.5 text-center text-sm font-bold text-slate-800 outline-none"
                />

                {/* AM/PM */}
                <div className="ml-2 flex overflow-hidden rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAmpm('AM')}
                    className={`px-2.5 py-1 text-xs font-bold ${
                      ampm === 'AM'
                        ? 'bg-slate-100 text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmpm('PM')}
                    className={`px-2.5 py-1 text-xs font-bold ${
                      ampm === 'PM'
                        ? 'bg-slate-100 text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ข้อเสนอแนะ */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            ข้อเสนอแนะ
          </p>

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="หัวเรื่อง"
            className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={8}
            placeholder="รายละเอียด....."
            className="mt-3 w-full resize-none rounded-2xl bg-slate-100 px-5 py-3 text-sm placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-full bg-blue-600 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
        >
          บันทึก
        </button>
      </div>
    </div>
  )
}