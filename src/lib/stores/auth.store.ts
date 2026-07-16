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

type AuthState = {
  // ── state ─────────────────────────
  profile: StoredProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // ── actions ───────────────────────
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loadProfile: () => void
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ─── LOGIN ──────────────────────────────────────────
  // src/lib/stores/auth.store.ts
login: async (username, password) => {
  set({ isLoading: true, error: null })

  try {
    // ── Step 1: login ─────────────────────
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        platform: 'web',
        device: 'mobile',
      }),
    })
    const json = await res.json()

    if (!json.success) {
      const errorMsg = json.error ?? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      set({ isLoading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }

    const { accessToken, refreshToken } = json.data

    // ── Step 2: save tokens ก่อน ──────────
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)

    // ── Step 3: fetch profile ─────────────
    const profileRes = await apiFetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profileJson = await profileRes.json()

    if (!profileJson.success) {
      clearTokens()
      const errorMsg = 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'
      set({ isLoading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }

    // field ตรงกับ StoredProfile
    const profile: StoredProfile = profileJson.data

    // ── Step 4: เช็ค role: employee ─────
    if (!profile.roleTypes?.includes('employee')) {
      clearTokens()
      const errorMsg = 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานแอปพนักงาน'
      set({ isLoading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }

    // ── Step 5: save ────────────────────
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
    const errorMsg = err?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    set({ isLoading: false, error: errorMsg })
    return { success: false, error: errorMsg }
  }
},

  // ─── LOGOUT ─────────────────────────────────────────
  logout: () => {
    clearTokens()
    set({
      profile: null,
      isAuthenticated: false,
      error: null,
    })
  },

  // ─── LOAD PROFILE FROM localStorage (ตอน app start) ─
  loadProfile: () => {
    const token = getAccessToken()
    const profile = getProfile()

    if (token && profile) {
      set({
        profile,
        isAuthenticated: true,
      })
    } else {
      set({
        profile: null,
        isAuthenticated: false,
      })
    }
  },

  // ─── REFRESH PROFILE FROM BACKEND ───────────────────
  refreshProfile: async () => {
    try {
      const res = await apiFetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      })
      const json = await res.json()

      if (json.success) {
        setProfile(json.data)
        set({ profile: json.data, isAuthenticated: true })
      }
    } catch {
      // silent fail
    }
  },
}))