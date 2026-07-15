'use client'

import { getRefreshToken, setAccessToken, clearTokens, authHeader } from '@/lib/auth-token'

let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.success || !json?.data?.accessToken) return false
    setAccessToken(json.data.accessToken)
    return true
  } catch {
    return false
  }
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = { ...authHeader(), ...(init?.headers as Record<string, string> ?? {}) }
  let res = await fetch(input, { ...init, headers })

  if (res.status !== 401) return res

  if (!refreshing) {
    refreshing = tryRefresh().finally(() => { refreshing = null })
  }
  const ok = await refreshing

  if (!ok) {
    clearTokens()
    if (typeof window !== 'undefined') window.location.href = '/login'
    return res
  }

  const retryHeaders = { ...authHeader(), ...(init?.headers as Record<string, string> ?? {}) }
  res = await fetch(input, { ...init, headers: retryHeaders })
  return res
}
