import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/users/${id}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword: body.newPassword }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
