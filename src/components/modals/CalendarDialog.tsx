'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/lib/store'

/* ─── Types ─── */
export interface ExistingBooking {
  id: string
  startDate: string // 'YYYY-MM-DD'
  endDate: string
  status: 'booked' | 'cancelled'
}

interface Props {
  startDate: Date
  endDate: Date
  existingBookings?: ExistingBooking[]
  onClose: () => void
  onConfirm: (start: Date, end: Date) => void
}

/* ─── Helpers ─── */
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/* ─── Component ─── */
export default function CalendarDialog({
  startDate,
  endDate,
  existingBookings = [],
  onClose,
  onConfirm,
}: Props) {
  const { openDialog, closeDialog } = useUIStore()

  const [viewMonth, setViewMonth] = useState(startDate.getMonth())
  const [viewYear, setViewYear] = useState(startDate.getFullYear())
  const [tempStart, setTempStart] = useState<Date | null>(startDate)
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate)

  useEffect(() => {
    openDialog()
    document.body.style.overflow = 'hidden'
    return () => {
      closeDialog()
      document.body.style.overflow = ''
    }
  }, [openDialog, closeDialog])

  /* ─── สร้าง map ของวันที่ถูกจอง / ยกเลิก ─── */
  const bookingMap = useMemo(() => {
    const map = new Map<string, ExistingBooking>()

    existingBookings.forEach((b) => {
      const start = parseKey(b.startDate)
      const end = parseKey(b.endDate)

      const cur = new Date(start)
      while (cur <= end) {
        map.set(toKey(cur), b)
        cur.setDate(cur.getDate() + 1)
      }
    })

    return map
  }, [existingBookings])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

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

  /* ─── ตรวจว่ามีวันที่ถูกจอง (booked) อยู่ในช่วงหรือไม่ ─── */
  const hasBookedInRange = (start: Date, end: Date) => {
    const cur = new Date(start)
    while (cur <= end) {
      const b = bookingMap.get(toKey(cur))
      if (b?.status === 'booked') return true
      cur.setDate(cur.getDate() + 1)
    }
    return false
  }

  const handleClickDate = (day: number) => {
    const d = new Date(viewYear, viewMonth, day)
    const existing = bookingMap.get(toKey(d))

    // 🚫 ถ้ามีการจองอยู่แล้ว → กดไม่ได้
    if (existing?.status === 'booked') return

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(d)
      setTempEnd(null)
    } else if (d < tempStart) {
      setTempStart(d)
    } else {
      // 🚫 ถ้า range ที่จะเลือกทับช่วงที่ถูกจอง → ไม่ให้เลือก
      if (hasBookedInRange(tempStart, d)) return
      setTempEnd(d)
    }
  }

  const isInSelectedRange = (d: Date) => {
    if (!tempStart || !tempEnd) return false
    return d > tempStart && d < tempEnd
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full rounded-3xl border border-blue-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {monthNames[viewMonth]} {viewYear + 543}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold">
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
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const currentDate = new Date(viewYear, viewMonth, day)
            const dow = currentDate.getDay()
            const key = toKey(currentDate)
            const existing = bookingMap.get(key)

            const isBooked = existing?.status === 'booked'
            const isCancelled = existing?.status === 'cancelled'

            const isStart = tempStart && isSameDay(currentDate, tempStart)
            const isEnd = tempEnd && isSameDay(currentDate, tempEnd)
            const isEndpoint = isStart || isEnd
            const inSelected = isInSelectedRange(currentDate)

            /* ─── ตรวจตำแหน่งใน range ที่ถูกจอง เพื่อวาดไฮไลท์ pill ─── */
            const prev = new Date(viewYear, viewMonth, day - 1)
            const next = new Date(viewYear, viewMonth, day + 1)
            const prevBooked =
              bookingMap.get(toKey(prev))?.status === 'booked' && isBooked
            const nextBooked =
              bookingMap.get(toKey(next))?.status === 'booked' && isBooked

            const bookedRounding = isBooked
              ? `${!prevBooked ? 'rounded-l-full' : ''} ${
                  !nextBooked ? 'rounded-r-full' : ''
                }`
              : ''

            return (
              <div key={day} className="relative flex items-center justify-center">
                {/* ─── Layer: Booked pill (ไฮไลท์ช่วงจองเดิม) ─── */}
                {isBooked && (
                  <span
                    className={`absolute inset-y-1 left-0 right-0 bg-blue-100 ${bookedRounding}`}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleClickDate(day)}
                  disabled={isBooked}
                  className={`relative z-10 flex aspect-square w-full items-center justify-center rounded-xl text-sm transition-all ${
                    isEndpoint
                      ? 'bg-blue-600 font-bold text-white shadow-md'
                      : inSelected
                        ? 'bg-blue-200 text-blue-800'
                        : isBooked
                          ? 'cursor-not-allowed font-semibold text-blue-700'
                          : dow === 0 || dow === 6
                            ? 'text-red-400 hover:bg-slate-100'
                            : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}

                  {/* Dot สีแดง ถ้าถูกยกเลิก */}
                  {isCancelled && !isEndpoint && (
                    <span className="absolute right-1 top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Legend + Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-6 rounded-full bg-blue-100" />
              <span className="text-slate-500">มีการจองแล้ว</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-slate-500">ยกเลิกการจอง</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-orange-500 px-6 py-2 text-sm font-bold text-white hover:bg-orange-600"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!tempStart || !tempEnd}
              onClick={() =>
                tempStart && tempEnd && onConfirm(tempStart, tempEnd)
              }
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}