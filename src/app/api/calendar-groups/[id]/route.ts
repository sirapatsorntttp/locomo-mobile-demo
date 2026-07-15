import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

function toFront(g: any) {
  if (!g) return g
  const { company_plant_id, ...rest } = g
  return { ...rest, company_plant_id, plant_company_id: company_plant_id }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/calendar-groups/${id}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toFront(result.data))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const payload: Record<string, unknown> = {}
  if (body.name        !== undefined) payload.name        = body.name
  if (body.color       !== undefined) payload.color       = body.color
  if (body.description !== undefined) payload.description = body.description

  const result = await backendFetch<any>(`/calendar-groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toFront(result.data))
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/calendar-groups/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toFront(result.data))
}
