import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Vehicle } from '@/types'

function toVehicle(v: any): Vehicle {
  const vt = v.vehicleType ?? v.vehicle_type ?? undefined
  return {
    id: v.id,
    vehicle_type_id: v.vehicleTypeId ?? v.vehicle_type_id ?? '',
    code: v.code,
    province: v.province,
    license: v.license,
    capacity: v.capacity ?? null,
    is_status: v.status ?? v.is_status ?? 'active',
    created_by: v.createdBy ?? v.created_by ?? null,
    created_at: v.createdAt ? String(v.createdAt) : '',
    updated_by: v.updatedBy ?? v.updated_by ?? null,
    updated_at: v.updatedAt ? String(v.updatedAt) : null,
    vehicle_type: vt
      ? {
          id: vt.id,
          name_th: vt.nameTh ?? vt.name_th ?? '',
          name_en: vt.nameEn ?? vt.name_en ?? '',
          is_status: vt.status ?? vt.is_status ?? 'active',
          created_by: vt.createdBy ?? vt.created_by ?? null,
          created_at: vt.createdAt ? String(vt.createdAt) : '',
          updated_by: vt.updatedBy ?? vt.updated_by ?? null,
          updated_at: vt.updatedAt ? String(vt.updatedAt) : null,
        }
      : undefined,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id')) query.set('id', searchParams.get('id')!)
  if (searchParams.get('code')) query.set('code', searchParams.get('code')!)
  if (searchParams.get('license')) query.set('license', searchParams.get('license')!)
  if (searchParams.get('province')) query.set('province', searchParams.get('province')!)
  if (searchParams.get('vehicle_type_id')) query.set('vehicle_type_id', searchParams.get('vehicle_type_id')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  if (searchParams.get('is_status')) query.set('status', searchParams.get('is_status')!)
  query.set('limit', searchParams.get('limit') ?? searchParams.get('per_page') ?? '200')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/vehicles?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const { total, data } = result.data
  return apiSuccess({ total, data: data.map(toVehicle) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
