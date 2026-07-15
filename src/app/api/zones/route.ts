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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id')) query.set('id', searchParams.get('id')!)
  if (searchParams.get('code')) query.set('code', searchParams.get('code')!)
  if (searchParams.get('name')) query.set('name', searchParams.get('name')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  if (searchParams.get('company_plant_ids')) query.set('company_plant_ids', searchParams.get('company_plant_ids')!)
  query.set('limit', searchParams.get('limit') ?? '10')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/zones?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const { total, data } = result.data
  return apiSuccess({ total, data: data.map(toZone) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/zones', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
