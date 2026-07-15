import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''
  const query = new URLSearchParams()
  if (searchParams.get('id'))                       query.set('id', searchParams.get('id')!)
  if (searchParams.get('code'))                     query.set('code', searchParams.get('code')!)
  if (searchParams.get('route_id'))                 query.set('route_id', searchParams.get('route_id')!)
  if (searchParams.get('shift_id'))                 query.set('shift_id', searchParams.get('shift_id')!)
  if (searchParams.get('vendor_driver_vehicle_id')) query.set('vendor_driver_vehicle_id', searchParams.get('vendor_driver_vehicle_id')!)
  if (searchParams.get('is_status'))                query.set('is_status', searchParams.get('is_status')!)
  query.set('limit', searchParams.get('limit') ?? '500')
  query.set('page',  searchParams.get('page') ?? '1')
  const result = await backendFetch(`/posts?${query}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
// สร้าง Post ใหม่
export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch('/posts', {
    method: 'POST',
    body: JSON.stringify({
      code:                     body.code,
      route_id:                 body.route_id,
      shift_id:                 body.shift_id,
      vendor_driver_vehicle_id: body.driver_vehicle_vendor_id,
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}