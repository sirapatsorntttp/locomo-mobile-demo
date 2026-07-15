
// app/api/vendors/all/driver-vehicles/route.ts
import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { DriverVehicleVendor } from '@/types'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<{ total: number; data: DriverVehicleVendor[] }>(
    `/vendors/all/driver-vehicles`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
