import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function POST(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<{ message: any }>('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization:   auth,
      'user-platform': request.headers.get('user-platform') ?? 'web',
      'user-device':   request.headers.get('user-device')   ?? 'pc',
      'user-agent':    request.headers.get('user-agent')    ?? '',
    },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
