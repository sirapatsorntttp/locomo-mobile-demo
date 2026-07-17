'use client'

import { useEffect } from 'react'
import {
  X,
  Bus,
  Bell,
  Ticket,
  Calendar,
  Route,
  MapPin,
  Timer,
  User,
  IdCard,
  Users,
  Building2,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'

export interface NotifyItem {
  id: string
  type: 'important' | 'booking'
  category: 'booking-success' | 'booking-cancel' | 'time'
  title: string
  subtitle: string
  extra?: string
  time: string
  read: boolean
  detail?: {
    bookingNo: string
    status: string
    dateTime: string
    route: string
    pickup: string
    pickupTime: string
    user: {
      name: string
      empCode: string
      department: string
      plant: string
    }
  }
}

interface Props {
  item: NotifyItem
  onClose: () => void
}

export default function NotifyDialog({ item, onClose }: Props) {
  const { openDialog, closeDialog } = useUIStore()

  useEffect(() => {
    openDialog()
    document.body.style.overflow = 'hidden'
    return () => {
      closeDialog()
      document.body.style.overflow = ''
    }
  }, [openDialog, closeDialog])

  const iconConfig = getIconConfig(item.category)
  const d = item.detail

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 sm:items-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white sm:rounded-3xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto px-6 pb-6 pt-6">
          {/* Head */}
          <div className="flex items-start gap-3">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconConfig.bg}`}
            >
              <iconConfig.Icon size={26} className="text-white" />
            </div>
            <div className="flex-1 pr-8">
              <p className="text-base font-bold text-slate-800">
                {item.title}
              </p>
              {d && (
                <>
                  <p className="mt-0.5 text-xs text-slate-500">
                    หมายเลขการจอง: {d.bookingNo}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    สถานะ:{' '}
                    <span className="font-semibold text-green-600">
                      {d.status}
                    </span>
                  </p>
                </>
              )}
              {!d && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>

          <hr className="my-4 border-slate-100" />

          {d ? (
            <>
              {/* Section: รายละเอียด */}
              <SectionTitle>รายละเอียด</SectionTitle>
              <div className="space-y-3">
                <DetailRow
                  Icon={Calendar}
                  label="วันที่และเวลา"
                  value={d.dateTime}
                />
                <DetailRow
                  Icon={Route}
                  label="เส้นทาง"
                  value={d.route}
                />
                <DetailRow
                  Icon={MapPin}
                  label="จุดขึ้นรถ"
                  value={d.pickup}
                />
                <DetailRow
                  Icon={Timer}
                  label="เวลารับ"
                  value={d.pickupTime}
                />
              </div>

              {/* Section: รายละเอียดรถและคนขับ */}
              <SectionTitle className="mt-5">
                รายละเอียดรถและคนขับ
              </SectionTitle>
              <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">
                ยังไม่มีข้อมูล
              </div>

              {/* Section: รายละเอียดผู้จอง */}
              <SectionTitle className="mt-5">
                รายละเอียดผู้จอง
              </SectionTitle>
              <div className="space-y-3">
                <DetailRow
                  Icon={User}
                  label="ชื่อผู้จอง"
                  value={d.user.name}
                />
                <DetailRow
                  Icon={IdCard}
                  label="รหัสพนักงาน"
                  value={d.user.empCode}
                />
                <DetailRow
                  Icon={Users}
                  label="แผนก"
                  value={d.user.department}
                />
                <DetailRow
                  Icon={Building2}
                  label="โรงงาน"
                  value={d.user.plant}
                />
              </div>

              {/* Action */}
              <button
                type="button"
                className="mt-6 w-full rounded-2xl bg-amber-400 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-amber-500 active:scale-[0.98]"
              >
                แก้ไขการจอง
              </button>
            </>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {item.extra ?? item.subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ─── */
function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3
      className={`mb-3 text-sm font-bold text-blue-600 ${className}`}
    >
      {children}
    </h3>
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

function getIconConfig(category: NotifyItem['category']) {
  switch (category) {
    case 'booking-success':
      return { Icon: Bus, bg: 'bg-blue-500' }
    case 'booking-cancel':
      return { Icon: Ticket, bg: 'bg-sky-400' }
    case 'time':
      return { Icon: Bell, bg: 'bg-green-500' }
    default:
      return { Icon: Bell, bg: 'bg-slate-400' }
  }
}