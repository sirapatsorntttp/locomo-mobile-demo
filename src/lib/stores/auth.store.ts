// src/lib/stores/auth.store.ts
import { create } from 'zustand'
import { apiFetch } from '@/lib/api-fetch'
import {
  setAccessToken,
  setRefreshToken,
  setProfile,
  clearTokens,
  getProfile,
  getAccessToken,
  StoredProfile,
} from '@/lib/auth-token'

const extractErrorMessage = (err: any): string => {
  if (!err) return 'เกิดข้อผิดพลาด'
  if (typeof err === 'string') return err
  if (typeof err === 'object') {
    return err.th ?? err.en ?? err.message ?? 'เกิดข้อผิดพลาด'
  }
  return String(err)
}

type AuthState = {
  profile: StoredProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  loadProfile: () => void
  fetchProfile: () => Promise<StoredProfile | null>
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null })

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
       
        }),
      })
      const json = await res.json()

      if (!json.success) {
        const errorMsg = extractErrorMessage(json.error) || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        set({ isLoading: false, error: errorMsg })
        return { success: false, error: errorMsg }
      }

      const { accessToken, refreshToken } = json.data

      setAccessToken(accessToken)
      setRefreshToken(refreshToken)

      const profileRes = await apiFetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const profileJson = await profileRes.json()

      if (!profileJson.success) {
        clearTokens()
        const errorMsg = extractErrorMessage(profileJson.error) || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'
        set({ isLoading: false, error: errorMsg })
        return { success: false, error: errorMsg }
      }

      const profile: StoredProfile = profileJson.data

      if (!profile.roleTypes?.includes('employee')) {
        clearTokens()
        const errorMsg = 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานแอปพนักงาน'
        set({ isLoading: false, error: errorMsg })
        return { success: false, error: errorMsg }
      }

      setProfile(profile)
      set({
        profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      return { success: true }
    } catch (err: any) {
      clearTokens()
      const errorMsg = extractErrorMessage(err) || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      set({ isLoading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }
  },

  logout: async () => {
    try {
      const token = getAccessToken()
      if (token) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch {
      // silent fail
    }

    clearTokens()
    set({
      profile: null,
      isAuthenticated: false,
      error: null,
    })
  },

  loadProfile: () => {
    const token = getAccessToken()
    const profile = getProfile()

    if (token && profile) {
      set({ profile, isAuthenticated: true })
    } else {
      set({ profile: null, isAuthenticated: false })
    }
  },

  fetchProfile: async () => {
    try {
      const token = getAccessToken()
      if (!token) return null

      const res = await apiFetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()

      if (json.success) {
        const profile: StoredProfile = json.data
        setProfile(profile)
        set({ profile, isAuthenticated: true })
        return profile
      }
      return null
    } catch {
      return null
    }
  },
}))