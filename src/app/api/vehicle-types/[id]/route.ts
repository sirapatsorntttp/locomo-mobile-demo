import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { VehicleType } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/vehicle-types/${id}`, {
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

  const result = await backendFetch<any>(`/vehicle-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
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

  const result = await backendFetch<VehicleType>(`/vehicle-types/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
