import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { VehicleType } from '@/types'

function toVehicleType(vt: any): VehicleType {
  return {
    id: vt.id,
    name_th: vt.nameTh ?? vt.name_th ?? '',
    name_en: vt.nameEn ?? vt.name_en ?? '',
    is_status: vt.status ?? vt.is_status ?? 'active',
    created_by: vt.createdBy ?? vt.created_by ?? null,
    created_at: vt.createdAt ? String(vt.createdAt) : '',
    updated_by: vt.updatedBy ?? vt.updated_by ?? null,
    updated_at: vt.updatedAt ? String(vt.updatedAt) : null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id')) query.set('id', searchParams.get('id')!)
  if (searchParams.get('name')) query.set('name', searchParams.get('name')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  query.set('limit', searchParams.get('limit') ?? '200')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/vehicle-types?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const { total, data } = result.data
  return apiSuccess({ total, data: data.map(toVehicleType) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/vehicle-types', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
