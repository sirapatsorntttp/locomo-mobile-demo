import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<{ message: any }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: body.currentPassword,
      newPassword:     body.newPassword,
    }),
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
