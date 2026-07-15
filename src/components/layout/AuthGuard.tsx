'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.replace('/login')
    }
  }, [router])

  return null
}
