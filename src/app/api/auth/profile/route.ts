export const dynamic = 'force-dynamic'

import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

interface ProfileUser {
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

// GET /api/auth/profile
export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return apiError('Unauthorized', 401)
  }

  const result = await backendFetch<ProfileUser>('/auth/profile-user', {
    method: 'GET',
    headers: { Authorization: authorization },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
