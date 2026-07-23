'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Bus, ScanLine, Clock3, User,Settings } from 'lucide-react'
import { useUIStore } from '@/lib/store'

const menus = [
  { href: '/mobile/home',     label: 'Home',      icon: House },
  { href: '/mobile/tracking', label: 'ติดตามรถ',  icon: Bus },
  { href: '/mobile/history',  label: 'History',   icon: Clock3 },
  { href: '/mobile/profile',  label: 'Setting',   icon: Settings },
]



const HIDE_ON_ROUTES = [
  '/mobile/qr',
  
  // หน้า ที่ต้องการ fullscreen
]

export default function BottomNav() {
  const pathname = usePathname()
  const {isDialogOpen} = useUIStore()

  
 const shouldHide = HIDE_ON_ROUTES.some((route) =>
    pathname?.startsWith(route)
  )

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/')
  const isQRActive = isActive('/mobile/qrcode')

  if (shouldHide || isDialogOpen) return null

  return (
    <div className="fixed bottom-5 left-5 right-5 z-50">
      <div className="relative mx-auto max-w-md">
        {/* Pill Bar */}
        <div className="flex h-[72px] w-full items-center justify-around rounded-full border-2 border-black bg-white px-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          {/* Left group: Home + ติดตามรถ */}
          {menus.slice(0, 2).map((m) => {
            const Icon = m.icon
            const active = isActive(m.href)
            return (
              <Link
                key={m.href}
                href={m.href}
                className="flex flex-col items-center justify-center gap-1"
              >
                <Icon
                  className={`h-6 w-6 ${active ? 'text-blue-600' : 'text-gray-400'}`}
                  strokeWidth={2}
                />
                <span
                  className={`text-xs ${
                    active
                      ? 'font-semibold text-blue-600'
                      : 'font-medium text-gray-500'
                  }`}
                >
                  {m.label}
                </span>
              </Link>
            )
          })}

          {/* Placeholder ตรงกลาง เว้นที่ให้ปุ่ม QR */}
          <div className="w-14" />

          {/* Right group: History + Profile */}
          {menus.slice(2).map((m) => {
            const Icon = m.icon
            const active = isActive(m.href)
            return (
              <Link
                key={m.href}
                href={m.href}
                className="flex flex-col items-center justify-center gap-1"
              >
                <Icon
                  className={`h-6 w-6 ${active ? 'text-blue-600' : 'text-gray-400'}`}
                  strokeWidth={2}
                />
                <span
                  className={`text-xs ${
                    active
                      ? 'font-semibold text-blue-600'
                      : 'font-medium text-gray-500'
                  }`}
                >
                  {m.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Floating QR Button */}
        <Link
          href="/mobile/qrcode"
          className="absolute left-1/2 top-1 -translate-x-1/2 -translate-y-1/4"
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-white transition-transform hover:scale-105 ${
              isQRActive
                ? 'bg-blue-700 shadow-lg shadow-blue-500/50'
                : 'bg-blue-600 shadow-lg shadow-blue-500/40'
            }`}
          >
            <ScanLine className="h-7 w-7 text-white" strokeWidth={2.2} />
          </div>
        </Link>
      </div>
    </div>
  )
}
