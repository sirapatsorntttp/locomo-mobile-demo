import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Zone } from '@/types'

function toZone(z: any): Zone {
  return {
    id: z.id,
    code: z.code,
    name_th: z.nameTh ?? z.name_th ?? '',
    name_en: z.nameEn ?? z.name_en ?? '',
    is_status: z.status ?? z.is_status ?? 'active',
    created_by: z.createdBy ?? z.created_by ?? null,
    created_at: z.createdAt ? String(z.createdAt) : '',
    updated_by: z.updatedBy ?? z.updated_by ?? null,
    updated_at: z.updatedAt ? String(z.updatedAt) : null,
    routes: Array.isArray(z.zones_routes)
      ? z.zones_routes
          .filter((zr: any) => zr.routes)
          .map((zr: any) => {
            const r = zr.routes
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
          })
      : undefined,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/zones/${id}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toZone(result.data))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/zones/${id}`, {
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

  const result = await backendFetch<Zone>(`/zones/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
