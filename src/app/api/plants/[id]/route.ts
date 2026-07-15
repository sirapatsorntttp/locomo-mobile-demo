import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Plant } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<Plant>(`/plants/${id}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<Plant>(`/plants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      code:       body.code,
      name_th:    body.name_th,
      name_en:    body.name_en,
      latitude:   body.latitude,
      longitude:  body.longitude,
      company_id: body.company_id,
      status:     body.is_status ?? body.status,
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<void>(`/plants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'inactive' }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
