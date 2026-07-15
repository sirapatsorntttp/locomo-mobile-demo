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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id')) query.set('id', searchParams.get('id')!)
  if (searchParams.get('code')) query.set('code', searchParams.get('code')!)
  if (searchParams.get('name')) query.set('name', searchParams.get('name')!)
  if (searchParams.get('trip_direction')) query.set('trip_direction', searchParams.get('trip_direction')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  if (searchParams.get('company_plant_ids')) query.set('company_plant_ids', searchParams.get('company_plant_ids')!)
  query.set('limit', searchParams.get('limit') ?? '10')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/routes?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const { total, data } = result.data
  return apiSuccess({ total, data: data.map(toRoute) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/routes', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
