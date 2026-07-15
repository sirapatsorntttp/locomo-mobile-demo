export const dynamic = 'force-dynamic'

import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

interface LoginRequest { username: string; password: string; platform?: string; device?: string }
interface LoginResponse { accessToken: string; refreshToken: string }

// POST /api/auth/login
export async function POST(request: Request) {
  const body: LoginRequest = await request.json()

  if (!body.username || !body.password) {
    return apiError('username และ password จำเป็นต้องกรอก', 400)
  }

  const result = await backendFetch<LoginResponse>('/auth/login-user', {
    method: 'POST',
    body: JSON.stringify({
      username: body.username,
      password: body.password,
    }),
    headers: {
      'user-agent': request.headers.get('user-agent') ?? 'locomo-web',
      'user-platform': body.platform ?? 'web',
      'user-device': body.device ?? 'pc',
    },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
