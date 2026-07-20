'use client'

import { useState, useMemo } from 'react'
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { mockSchedule, ScheduleType, type ScheduleItem } from '@/lib/mockData'
import ScheduleDialog from '@/components/modals/ScheduleDialog'

export default function SchedulePage() {
  const openMenu = useUIStore((s) => s.openMenu)

  const [viewMonth, setViewMonth] = useState(4)   // May (0-indexed)
  const [viewYear, setViewYear] = useState(2026)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ]
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

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

  // Map: 'YYYY-MM-DD' → ScheduleItem[]
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>()
    mockSchedule.forEach((s) => {
      const list = map.get(s.date) ?? []
      list.push(s)
      map.set(s.date, list)
    })
    return map
  }, [])

  const toKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const selected = mockSchedule.find((s) => s.id === selectedId) ?? null

  /* สร้าง grid 6 แถว × 7 คอลัมน์ (42 cells) */
  const totalCells = 42
  const cells = Array.from({ length: totalCells }).map((_, idx) => {
    const dayNum = idx - firstDayOfMonth + 1

    if (dayNum < 1) {
      // เดือนก่อนหน้า
      const d = daysInPrevMonth + dayNum
      return { day: d, currentMonth: false, key: '' }
    } else if (dayNum > daysInMonth) {
      // เดือนถัดไป
      const d = dayNum - daysInMonth
      return { day: d, currentMonth: false, key: '' }
    } else {
      return {
        day: dayNum,
        currentMonth: true,
        key: toKey(viewYear, viewMonth, dayNum),
      }
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="rounded-b-[40px] bg-gradient-to-b from-blue-500 to-blue-600 px-5 pb-16 pt-12">
        <div className="relative flex items-center justify-center">
          <h1 className="text-xl font-bold text-white">ปฏิทินการทำงาน</h1>
          <button
            type="button"
            onClick={openMenu}
            aria-label="Menu"
            className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Month switcher */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="min-w-[180px] text-center text-base font-bold text-white">
            {monthNames[viewMonth]} {viewYear + 543}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="-mt-8 mx-5 flex items-center justify-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
        <LegendDot color="bg-red-200" label="วันหยุด" />
        <LegendDot color="bg-blue-200" label="การจอง" />
        <LegendDot color="bg-amber-200" label="กิจกรรม" />
      </div>

      {/* Calendar Grid */}
      <div className="mt-4 mx-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Day names */}
        <div className="grid grid-cols-7 bg-blue-500">
          {dayNames.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-[10px] font-bold ${
                i === 0 || i === 6 ? 'text-red-100' : 'text-white'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const items = cell.currentMonth
              ? scheduleMap.get(cell.key) ?? []
              : []
            const dow = idx % 7
            const isWeekend = dow === 0 || dow === 6

            return (
              <div
                key={idx}
                className={`min-h-[80px] border-b border-r border-slate-200 p-1 ${
                  !cell.currentMonth
                    ? 'bg-slate-50 text-slate-300'
                    : isWeekend
                      ? 'bg-white'
                      : 'bg-white'
                }`}
              >
                {/* Date number */}
                <div
                  className={`px-1 text-xs font-semibold ${
                    !cell.currentMonth
                      ? 'text-slate-300'
                      : isWeekend
                        ? 'text-red-400'
                        : 'text-slate-700'
                  }`}
                >
                  {cell.day}
                </div>

                {/* Events */}
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 2).map((item) => (
                    <EventPill
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedId(item.id)}
                    />
                  ))}
                  {items.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(items[2].id)}
                      className="w-full text-left text-[9px] font-semibold text-slate-500 hover:underline"
                    >
                      +{items.length - 2} เพิ่มเติม
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dialog */}
      {selected && (
        <ScheduleDialog
          item={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

/* ─── Sub Components ─── */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-[11px] text-slate-600">{label}</span>
    </div>
  )
}

function EventPill({
  item,
  onClick,
}: {
  item: ScheduleItem
  onClick: () => void
}) {
  const styles: Record<ScheduleType, string> = {
    holiday: 'bg-red-100 text-red-700 hover:bg-red-200',
    booking: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    event: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-semibold transition ${styles[item.type]}`}
    >
      {item.title}
    </button>
  )
}