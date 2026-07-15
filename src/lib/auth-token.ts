export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('access_token', token)
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('refresh_token', token)
}

export interface StoredProfile {
  code: string
  firstName: string
  lastName: string
  email?: string | null
  tel?: string | null
  roles: string[]
  roleTypes: string[]
  language: string
  companyId: string | null
  companyName: string | null
  companyCode: string | null
  companyPlantId: string | null
  plantIds: string[]
  allowedModules: string[]
}

export function getProfile(): StoredProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user_profile')
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export function setProfile(profile: StoredProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('user_profile', JSON.stringify(profile))
}

export function getRoleTypes(): string[] {
  return getProfile()?.roleTypes ?? []
}

export function isSuperAdmin(): boolean {
  return getRoleTypes().includes('superadmin')
}

export function isCompanyAdmin(): boolean {
  return getRoleTypes().includes('company_admin')
}

export function isAdmin(): boolean {
  return getRoleTypes().some(r => ['superadmin', 'company_admin', 'admin'].includes(r))
}

export function getPlantIds(): string[] {
  return getProfile()?.plantIds ?? []
}

export function getCompanyPlantId(): string | null {
  return getProfile()?.companyPlantId ?? null
}

export function getAllowedModules(): string[] {
  return getProfile()?.allowedModules ?? []
}

export function canAccess(path: string): boolean {
  const modules = getAllowedModules()
  if (!modules.length) return true
  return modules.some(d => d === path)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_profile')
}

export function authHeader(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
