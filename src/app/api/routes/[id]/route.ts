import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Route } from '@/types'

function toRoute(r: any): Route {
  return {
    id: r.id,
    code: r.code,
    name_th: r.nameTh ?? r.name_th ?? '',
    name_en: r.nameEn ?? r.name_en ?? '',
    trip_direction: r.tripDirection ?? r.trip_direction ?? 'unknown',
    is_status: r.status ?? r.is_status ?? 'active',
    created_by: r.createdBy ?? r.created_by ?? null,
    created_at: r.createdAt ? String(r.createdAt) : '',
    updated_by: r.updatedBy ?? r.updated_by ?? null,
    updated_at: r.updatedAt ? String(r.updatedAt) : null,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/routes/${id}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toRoute(result.data))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/routes/${id}`, {
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

  const result = await backendFetch<Route>(`/routes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
