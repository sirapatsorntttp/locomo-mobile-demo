import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

// ─── GET By ID ────────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/attendances/${id}`, {
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// ─── PATCH Update ─────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/attendances/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(body.employee_id !== undefined && { employee_id: body.employee_id }),
      ...(body.post_id !== undefined && { post_id: body.post_id }),
      ...(body.route_id !== undefined && { route_id: body.route_id }),
      ...(body.point_id !== undefined && { point_id: body.point_id }),
      ...(body.rfid !== undefined && { rfid: body.rfid }),
      ...(body.latitude !== undefined && { latitude: body.latitude }),
      ...(body.longitude !== undefined && { longitude: body.longitude }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.is_state !== undefined && { is_state: body.is_state }),
      ...(body.remark !== undefined && { remark: body.remark }),
    }),
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// ─── DELETE ───────────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/attendances/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}