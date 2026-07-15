import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; route_id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id, route_id } = await params

  const result = await backendFetch(`/zones/${id}/routes/${route_id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
