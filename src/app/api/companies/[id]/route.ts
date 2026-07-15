import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Company } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<Company>(`/companies/${id}`, {
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

  const payload: Record<string, unknown> = {}
  if (body.code         !== undefined) payload.code         = body.code
  if (body.name_th      !== undefined) payload.name_th      = body.name_th
  if (body.name_en      !== undefined) payload.name_en      = body.name_en
  if (body.company_type !== undefined) payload.company_type = body.company_type
  if (body.address      !== undefined) payload.address      = body.address
  if (body.logo         !== undefined) payload.logo         = body.logo
  if (body.is_status    !== undefined) payload.status       = body.is_status
  if (body.status       !== undefined) payload.status       = body.status

  const result = await backendFetch<Company>(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
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

  const result = await backendFetch<Company>(`/companies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
