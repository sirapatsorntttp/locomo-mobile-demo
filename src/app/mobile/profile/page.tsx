'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu,
  Building2,
  User,
  Mail,
  Phone,
  Bus,
  Pencil,
  SquarePen,
  Factory,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { useAuthStore } from '@/lib/stores/auth.store'
import EditRouteDialog from '@/components/modals/EditRouteDialog'
import { usePlantStore } from '@/lib/stores/plant.store'
import { useCompanyStore } from '@/lib/stores/company.store'

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
  const { profile, logout, fetchProfile } = useAuthStore()
  const { plants, loadPlants } = usePlantStore() 
const { companyPlants, loadCompanies } = useCompanyStore()
  const [lang, setLang] = useState<Language>('TH')

  // โหลด plants + refresh profile
  useEffect(() => {
    loadPlants()
    fetchProfile()
    loadCompanies()
  }, [])

 
  const userPlants = companyPlants.filter(p =>
    profile?.plantIds?.includes(p.id)
  )


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
<div
  className="relative rounded-b-[40px] px-5 pt-12 pb-16 overflow-hidden bg-cover bg-center"
  style={{ backgroundImage: "url('/images/bg.jpg')" }}
>
  {/* Overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

  {/* Content: Title ซ้าย + Menu ขวา */}
  <div className="relative z-10 flex items-start justify-between">
    <div>
      <h1 className="text-xl font-bold text-white drop-shadow-md">
        การตั้งค่า
      </h1>
      <p className="mt-1 text-xs text-white/90 drop-shadow">
        จัดการข้อมูลส่วนตัวของคุณ
      </p>
    </div>

    <button
      type="button"
      onClick={openMenu}
      aria-label="Menu"
      className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
    >
      <Menu size={22} />
    </button>
  </div>
</div>

{/* ─── Row: Avatar (กลาง) + Language Toggle (ขวา) — ลอยบนเส้นขอบ ─── */}
<div className="relative z-20 -mt-14 px-5">
  <div className="relative flex items-center justify-center">
    {/* Avatar อยู่กลางจริง ๆ */}
    <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg">
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-3xl font-bold text-white">
        {profile?.firstName?.charAt(0) ?? 'U'}
      </div>
    </div>

    {/* Language Toggle ลอยขวา ระดับกลาง Avatar */}
    <div className="absolute right-0 top-1/2 -translate-y-1/2">
      <LanguageToggle value={lang} onChange={setLang} />
    </div>
  </div>
</div>

{/* Spacer */}
<div className="h-6" />

   

      {/* ─── ข้อมูลส่วนตัว ─── */}
      <div className="px-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          ข้อมูลส่วนตัว
        </h2>

        <div className="divide-y divide-slate-300 border-b border-slate-300">
        
  <InfoRow
            icon={<Building2 size={22} className="text-slate-700" />}
            value={
              profile?.companyName
                ? profile.companyCode
                  ? `${profile.companyName} (${profile.companyCode})`
                  : profile.companyName
                : '-'
            }
          />
<InfoRow
icon={<Factory size={22} className="text-slate-700" />}
value={userPlants.length > 0 ? userPlants.map(cp => lang === 'TH' ? cp.plants?.name_th : cp.plants?.name_en).filter(Boolean).join(', '): '-'
}

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
      <div className="mt-8 px-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          ข้อมูลรถรับส่ง
        </h2>

        <div className="divide-y divide-slate-300">
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
              ? 'bg-[#3956FF] text-white shadow'
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
    <div className="flex items-center gap-4 py-3.5 ">
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
        <SquarePen  size={22} />
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