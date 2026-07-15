import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = _req.headers.get('Authorization') ?? ''
  const result = await backendFetch(`/drivers/${params.id}/route-defaults`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch(`/drivers/${params.id}/route-defaults`, {
    method: 'POST',
    body: JSON.stringify({ route_id: body.route_id, trip_direction: body.trip_direction }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const rdId = searchParams.get('rd_id') ?? ''
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch(`/drivers/${params.id}/route-defaults/${rdId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
