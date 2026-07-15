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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('route_id')) query.set('route_id', searchParams.get('route_id')!)
  if (searchParams.get('id')) query.set('id', searchParams.get('id')!)
  if (searchParams.get('code')) query.set('code', searchParams.get('code')!)
  if (searchParams.get('name')) query.set('name', searchParams.get('name')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  if (searchParams.get('company_plant_ids')) query.set('company_plant_ids', searchParams.get('company_plant_ids')!)
  query.set('limit', searchParams.get('limit') ?? '10')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/points?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const { total, data } = result.data
  return apiSuccess({ total, data: data.map(toPoint) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/points', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
