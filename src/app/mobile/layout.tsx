'use client'

import BottomNav from '@/components/mobile/bottom-nav'
import SideMenu from '@/components/mobile/SideMenu'
import { useUIStore } from '@/lib/store'
export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { menuOpen, closeMenu } = useUIStore()

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-32">{children}

         <SideMenu open={menuOpen} onClose={closeMenu} />
      </main>
      <BottomNav />
    </div>
  )
}