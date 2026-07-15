import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Point } from '@/types'

function toPoint(p: any): Point {
  return {
    id: p.id,
    route_id: p.routeId ?? p.route_id ?? '',
    code: p.code,
    name_th: p.nameTh ?? p.name_th ?? '',
    name_en: p.nameEn ?? p.name_en ?? '',
    latitude: p.latitude,
    longitude: p.longitude,
    queue_default: p.queueDefault ?? p.queue_default ?? null,
    is_status: p.status ?? p.is_status ?? 'active',
    created_by: p.createdBy ?? p.created_by ?? null,
    created_at: p.createdAt ? String(p.createdAt) : '',
    updated_by: p.updatedBy ?? p.updated_by ?? null,
    updated_at: p.updatedAt ? String(p.updatedAt) : null,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/points/${id}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toPoint(result.data))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/points/${id}`, {
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

  const result = await backendFetch<Point>(`/points/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
