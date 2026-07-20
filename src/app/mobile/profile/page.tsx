'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu,
  Building2,
  User,
  Mail,
  Phone,
  Bus,
  Pencil,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { useAuthStore } from '@/lib/stores/auth.store'
import EditRouteDialog from '@/components/modals/EditRouteDialog'

type Language = 'TH' | 'EN'

interface RouteInfo {
  id: string
  label: string
  code: string
  location: string
}

export default function ProfilePage() {
  const router = useRouter()
  const openMenu = useUIStore((s) => s.openMenu)
  const { profile, logout } = useAuthStore()

  const [lang, setLang] = useState<Language>('TH')

  const [editOpen, setEditOpen] = useState(false)

  // Mock ข้อมูลรถรับส่ง
  const routes: RouteInfo[] = [
    { id: 'r1', label: 'สายรถรับเข้า', code: 'A01',   location: 'อ่าวอุดม' },
    { id: 'r2', label: 'จุดขึ้นรถ',     code: 'A0101', location: 'อ่าวอุดม' },
    { id: 'r3', label: 'สายรถรับออก',  code: 'A01',   location: 'อ่าวอุดม' },
    { id: 'r4', label: 'จุดลงรถ',       code: 'A0101', location: 'อ่าวอุดม' },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }


  


  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ─── Header ─── */}
      <div className="relative rounded-b-[40px] bg-gradient-to-b from-blue-400 to-blue-500 px-5 pb-24 pt-12">
        {/* Menu top-right */}
        <div className="relative flex items-center justify-center">
          <h1 className="text-xl font-bold text-white drop-shadow">
            การตั้งค่า
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

        {/* Avatar (ครึ่งบน) */}
        <div className="absolute left-1/2 top-[75%] -translate-x-1/2">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg">
            {/* TODO: ใส่รูปจริง */}
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-3xl font-bold text-white">
              {profile?.firstName?.charAt(0) ?? 'U'}
            </div>
          </div>
        </div>

        {/* Language Toggle (ขวาล่างของ header) */}
        <div className="absolute bottom-4 right-5">
          <LanguageToggle value={lang} onChange={setLang} />
        </div>
      </div>

      {/* Spacer สำหรับ avatar ที่ทับลงมา */}
      <div className="h-16" />

      {/* ─── ข้อมูลส่วนตัว ─── */}
      <div className="px-5">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          ข้อมูลส่วนตัว
        </h2>

        <div className="divide-y divide-slate-200">
          <InfoRow
            icon={<Building2 size={22} className="text-slate-700" />}
            value="TT Techno-Park"
          />
          <InfoRow
            icon={<User size={22} className="text-slate-700" />}
            value={`${profile?.firstName ?? 'สมชาย'} ${profile?.lastName ?? 'ใจดี'}`}
          />
          <InfoRow
            icon={<Mail size={22} className="text-slate-700" />}
            value={profile?.email ?? 'สมชาย@gmail.com'}
          />
          <InfoRow
            icon={<Phone size={22} className="text-slate-700" />}
            value="081-xxx-xxxx"
          />
        </div>
      </div>

      {/* ─── ข้อมูลรถรับส่ง ─── */}
      <div className="mt-6 px-5">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          ข้อมูลรถรับส่ง
        </h2>

        <div className="divide-y divide-slate-200">
          {routes.map((r) => (
            <RouteRow key={r.id} route={r} />
          ))}
        </div>
      </div>

      {/* ─── Logout (optional) ─── */}
      <div className="mt-8 px-5">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl bg-red-500 py-3.5 font-bold text-white shadow-md transition hover:bg-red-600 active:scale-[0.98]"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}

/* ─── Language Toggle ─── */
function LanguageToggle({
  value,
  onChange,
}: {
  value: Language
  onChange: (v: Language) => void
}) {
  return (
    <div className="flex items-center rounded-full bg-white/90 p-1 shadow-md backdrop-blur">
      {(['TH', 'EN'] as Language[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
            value === l
              ? 'bg-blue-500 text-white shadow'
              : 'text-slate-600'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/* ─── Info Row (ข้อมูลส่วนตัว) ─── */
function InfoRow({
  icon,
  value,
}: {
  icon: React.ReactNode
  value: string
}) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {icon}
      </div>
      <span className="flex-1 text-base text-slate-700">{value}</span>
    </div>
  )
}

/* ─── Route Row (ข้อมูลรถ) ─── */
function RouteRow({ route }: { route: RouteInfo }) {

    const [editOpen, setEditOpen] = useState(false)

      const handleSaveRoute = (data: any) => {
    console.log('บันทึก:', data)
    setEditOpen(false)
    // TODO: เรียก API อัปเดต
  }
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
        <Bus size={26} className="text-slate-700" />
      </div>

      <div className="flex-1">
        <p className="text-base font-bold text-blue-600">
          {route.label}
        </p>
        <p className="text-sm font-semibold text-slate-400">
          {route.code} {route.location}
        </p>
      </div>

     
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

  )
}