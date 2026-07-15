import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

type Ctx = {
  params: Promise<{ id: string }>
}

// ดึง Post ตาม ID
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params
  const auth = req.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/posts/${id}`, {
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// แก้ไข Post
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()
  const auth = req.headers.get('Authorization') ?? ''

  const payload: Record<string, unknown> = {}

  if (body.code !== undefined)                     payload.code = body.code
  if (body.route_id !== undefined)                 payload.route_id = body.route_id
  if (body.shift_id !== undefined)                 payload.shift_id = body.shift_id
  if (body.driver_vehicle_vendor_id !== undefined) payload.vendor_driver_vehicle_id = body.driver_vehicle_vendor_id
  if (body.is_status !== undefined)                payload.is_status = body.is_status

  const result = await backendFetch(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// ลบ Post
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params
  const auth = req.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}