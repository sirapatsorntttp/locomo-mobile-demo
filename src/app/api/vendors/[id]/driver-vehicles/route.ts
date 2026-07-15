import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { DriverVehicleVendor } from '@/types'

// GET  /api/vendors/[id]/driver-vehicles — list driver-vehicle pairs for this vendor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const query = new URLSearchParams()
  query.set('limit', searchParams.get('limit') ?? '200')
  query.set('page',  searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: DriverVehicleVendor[] }>(
    `/vendors/${id}/driver-vehicles?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// POST /api/vendors/[id]/driver-vehicles — assign driver-vehicle to vendor
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<DriverVehicleVendor>(
    `/vendors/${id}/driver-vehicles`,
    {
      method: 'POST',
      body: JSON.stringify({ driver_vehicle_id: body.driver_vehicle_id }),
      headers: { Authorization: auth },
    },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}

// DELETE /api/vendors/[id]/driver-vehicles?driver_vehicle_id=xxx — unassign
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url)
  const driver_vehicle_id = searchParams.get('driver_vehicle_id')
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  if (!driver_vehicle_id) return apiError('driver_vehicle_id is required', 400)

  const result = await backendFetch<void>(
    `/vendors/${id}/driver-vehicles/${driver_vehicle_id}`,
    { method: 'DELETE', headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
