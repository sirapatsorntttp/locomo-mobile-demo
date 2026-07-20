'use client'

import { useEffect, useState } from 'react'
import {
  Bus,
  MapPin,
  Check,
  ChevronDown,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'

/* ─── Types ─── */
export interface RouteOption {
  id: string
  code: string
  name: string
}

export interface EditRouteData {
  tripIn: {
    routeId: string
    pickup: string
  }
  tripOut: {
    routeId: string
    pickup: string
  }
}

interface Props {
  user: {
    name: string
    empCode: string
  }
  initialData: EditRouteData
  routeOptions?: RouteOption[]
  pickupOptions?: string[]
  onClose: () => void
  onSave: (data: EditRouteData) => void
}

/* ─── Mock ─── */
const defaultRoutes: RouteOption[] = [
  { id: 'r1', code: 'A01', name: 'ตลาดน้ำแพร่ - โรงงาน' },
  { id: 'r2', code: 'A02', name: 'ตลาดน้ำแพร่ - โรงงาน' },
  { id: 'r3', code: 'A03', name: 'ตลาดน้ำแพร่ - โรงงาน' },
  { id: 'r4', code: 'A04', name: 'บ้านโพธิ์ - โรงงาน' },
  { id: 'r5', code: 'A05', name: 'อ่าวอุดม - โรงงาน' },
  { id: 'r6', code: 'A06', name: 'แหลมฉบัง - โรงงาน' },
]

const defaultPickups = [
  'หน้าโรงงาน',
  'หน้าตลาด',
  'หน้าโรงเรียน',
  'ป้ายรถเมล์',
]

/* ─── Component ─── */
export default function EditRouteDialog({
  user,
  initialData,
  routeOptions = defaultRoutes,
  pickupOptions = defaultPickups,
  onClose,
  onSave,
}: Props) {
  const { openDialog, closeDialog } = useUIStore()

  const [tripIn, setTripIn] = useState(initialData.tripIn)
  const [tripOut, setTripOut] = useState(initialData.tripOut)

  useEffect(() => {
    openDialog()
    document.body.style.overflow = 'hidden'
    return () => {
      closeDialog()
      document.body.style.overflow = ''
    }
  }, [openDialog, closeDialog])

  const handleSave = () => {
    onSave({ tripIn, tripOut })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5 py-6">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
          {/* ─── User Head ─── */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 shadow-md">
              <Bus size={26} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">
                {user.name}
              </p>
              <p className="text-sm text-slate-500">
                รหัสพนักงาน: {user.empCode}
              </p>
            </div>
          </div>

          <hr className="my-4 border-slate-200" />

          {/* ─── Trip In (ขาเข้า) ─── */}
          <TripSection
            title="Trip In (ขาเข้า)"
            titleColor="text-blue-500"
            iconColor="text-blue-500"
            selectedColor="blue"
            routes={routeOptions}
            selectedRouteId={tripIn.routeId}
            onSelectRoute={(id) =>
              setTripIn({ ...tripIn, routeId: id })
            }
            pickupOptions={pickupOptions}
            selectedPickup={tripIn.pickup}
            onSelectPickup={(p) =>
              setTripIn({ ...tripIn, pickup: p })
            }
          />

          <div className="h-6" />

          {/* ─── Trip Out (ขาออก) ─── */}
          <TripSection
            title="Trip Out (ขาออก)"
            titleColor="text-orange-500"
            iconColor="text-orange-500"
            selectedColor="orange"
            routes={routeOptions}
            selectedRouteId={tripOut.routeId}
            onSelectRoute={(id) =>
              setTripOut({ ...tripOut, routeId: id })
            }
            pickupOptions={pickupOptions}
            selectedPickup={tripOut.pickup}
            onSelectPickup={(p) =>
              setTripOut({ ...tripOut, pickup: p })
            }
          />
        </div>

        {/* ─── Footer buttons (สติกกี้ล่าง) ─── */}
        <div className="flex items-center justify-center gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[110px] rounded-2xl bg-red-500 py-3 font-bold text-white shadow-md transition hover:bg-red-600 active:scale-[0.98]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-w-[110px] rounded-2xl bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Trip Section (ใช้ซ้ำได้ทั้ง In/Out) ─── */
function TripSection({
  title,
  titleColor,
  iconColor,
  selectedColor,
  routes,
  selectedRouteId,
  onSelectRoute,
  pickupOptions,
  selectedPickup,
  onSelectPickup,
}: {
  title: string
  titleColor: string
  iconColor: string
  selectedColor: 'blue' | 'orange'
  routes: RouteOption[]
  selectedRouteId: string
  onSelectRoute: (id: string) => void
  pickupOptions: string[]
  selectedPickup: string
  onSelectPickup: (p: string) => void
}) {
  return (
    <section>
      <h3 className={`mb-3 text-base font-bold ${titleColor}`}>
        {title}
      </h3>

      {/* สายรถ label */}
      <div className={`mb-2 flex items-center gap-2 ${iconColor}`}>
        <Bus size={18} />
        <span className="text-sm font-semibold text-slate-700">
          สายรถ
        </span>
      </div>

      {/* ─── ตัวเลือกสายรถ (scroll ในกล่อง) ─── */}
      <div
        className="max-h-[168px] space-y-2 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {routes.map((r) => (
          <RouteRadio
            key={r.id}
            code={r.code}
            name={r.name}
            selected={selectedRouteId === r.id}
            color={selectedColor}
            onClick={() => onSelectRoute(r.id)}
          />
        ))}
      </div>

      {/* จุดรับส่ง label */}
      <div className={`mb-2 mt-4 flex items-center gap-2 ${iconColor}`}>
        <MapPin size={18} />
        <span className="text-sm font-semibold text-slate-700">
          จุดรับส่ง
        </span>
      </div>

      {/* Pickup dropdown */}
      <PickupSelect
        value={selectedPickup}
        options={pickupOptions}
        onChange={onSelectPickup}
      />
    </section>
  )
}

/* ─── Route Radio Item ─── */
function RouteRadio({
  code,
  name,
  selected,
  color,
  onClick,
}: {
  code: string
  name: string
  selected: boolean
  color: 'blue' | 'orange'
  onClick: () => void
}) {
  const activeColors = {
    blue: 'text-blue-500',
    orange: 'text-orange-500',
  }
  const activeBg = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-300"
    >
      {/* Radio circle */}
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
          selected
            ? activeBg[color]
            : 'border-2 border-slate-300'
        }`}
      >
        {selected && (
          <Check size={12} className="text-white" strokeWidth={3} />
        )}
      </span>

      {/* Code */}
      <span
        className={`text-base font-bold ${
          selected ? activeColors[color] : 'text-slate-700'
        }`}
      >
        {code}
      </span>

      <span className="text-slate-300">|</span>

      {/* Name */}
      <span className="flex-1 text-sm text-slate-700">
        {name}
      </span>
    </button>
  )
}

/* ─── Pickup Dropdown ─── */
function PickupSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (p: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-800 transition hover:bg-slate-200"
      >
        <span>{value || 'เลือกจุดรับส่ง'}</span>
        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition ${
                value === opt
                  ? 'bg-blue-50 font-semibold text-blue-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}