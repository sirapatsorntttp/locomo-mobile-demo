import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/drivers/${id}/vehicle`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_id: body.vehicle_id }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = _req.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/drivers/${id}/vehicle`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
