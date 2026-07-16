// src/app/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, loadProfile } = useAuthStore()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    // ── ยังไม่ login → ไป login ─────────
    if (!isAuthenticated) {
      router.replace('/login')
    } else {
      // ── login แล้ว → ไป mobile ─────────
      router.replace('/mobile')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400 text-sm">Loading...</div>
    </div>
  )
}
