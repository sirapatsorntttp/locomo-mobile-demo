export const dynamic = 'force-dynamic'

import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.refresh_token) {
    return apiError('refresh_token is required', 400)
  }

  const result = await backendFetch<{ accessToken: string; refreshToken: string }>(
    '/auth/refresh-token',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken: body.refresh_token }),
      headers: {
        'user-agent': request.headers.get('user-agent') ?? 'locomo-web',
        'user-platform': 'web',
        'user-device': 'pc',
      },
    },
  )

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
