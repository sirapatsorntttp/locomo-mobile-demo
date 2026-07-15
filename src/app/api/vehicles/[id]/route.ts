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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/vehicles/${id}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toVehicle(result.data))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<any>(`/vehicles/${id}`, {
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

  const result = await backendFetch<Vehicle>(`/vehicles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
