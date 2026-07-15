import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/users/${id}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ roleIds: body.roleIds ?? [] }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
