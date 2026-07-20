'use client'

import { useEffect } from 'react'
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Bus,
  PartyPopper,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import type { ScheduleItem, ScheduleType } from '@/lib/mockData'

interface Props {
  item: ScheduleItem
  onClose: () => void
}

const typeConfig: Record<
  ScheduleType,
  { icon: React.ElementType; bg: string; label: string }
> = {
  holiday: {
    icon: PartyPopper,
    bg: 'bg-red-500',
    label: 'วันหยุด',
  },
  booking: {
    icon: Bus,
    bg: 'bg-blue-500',
    label: 'การจอง',
  },
  event: {
    icon: CalendarIcon,
    bg: 'bg-amber-500',
    label: 'กิจกรรม',
  },
}

export default function ScheduleDialog({ item, onClose }: Props) {
  const { openDialog, closeDialog } = useUIStore()

  useEffect(() => {
    openDialog()
    document.body.style.overflow = 'hidden'
    return () => {
      closeDialog()
      document.body.style.overflow = ''
    }
  }, [openDialog, closeDialog])

  const config = typeConfig[item.type]
  const dateObj = new Date(item.date)
  const formatDate = () => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
    return `วัน${days[dateObj.getDay()]}ที่ ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
        >
          <X size={16} />
        </button>

        {/* Colored header */}
        <div className={`${config.bg} px-6 pb-5 pt-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25">
              <config.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/80">
                {config.label}
              </p>
              <h2 className="text-lg font-bold text-white">
                {item.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <DetailRow
            Icon={CalendarIcon}
            label="วันที่"
            value={formatDate()}
          />

          {item.time && (
            <DetailRow Icon={Clock} label="เวลา" value={item.time} />
          )}

          {item.subtitle && (
            <DetailRow
              Icon={MapPin}
              label="รายละเอียด"
              value={item.subtitle}
            />
          )}

          {item.routeCode && (
            <DetailRow
              Icon={Bus}
              label="สายรถ"
              value={item.routeCode}
            />
          )}

          {item.driver && (
            <DetailRow Icon={User} label="คนขับ" value={item.driver} />
          )}

          {item.detail && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {item.detail}
            </div>
          )}

          {/* Action */}
          {item.type === 'booking' && (
            <button
              type="button"
              className="mt-2 w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
            >
              ดูรายละเอียดการจอง
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-blue-500" />
      <div className="flex flex-1 items-start justify-between gap-3">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-right text-sm font-medium text-slate-800">
          {value}
        </span>
      </div>
    </div>
  )
}