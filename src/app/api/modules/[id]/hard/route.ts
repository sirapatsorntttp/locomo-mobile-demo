import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/modules/${params.id}/hard`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}