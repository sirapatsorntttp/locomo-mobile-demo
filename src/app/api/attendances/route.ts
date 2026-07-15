import { backendFetch, apiSuccess, apiError, parseSearchParams } from '@/lib/api-config'
import type { PaginatedResult, Attendance } from '@/types'

// GET /api/attendances
// Query: page, per_page, date_from, date_to, post_id, type, is_state

export async function GET(request: Request) {
  const params = parseSearchParams(request.url)
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(params.per_page),

    ...(searchParams.get('employee_id') && {
      employee_id: searchParams.get('employee_id')!,
    }),
    ...(searchParams.get('post_id') && {
      post_id: searchParams.get('post_id')!,
    }),
    ...(searchParams.get('route_id') && {
      route_id: searchParams.get('route_id')!,
    }),
    ...(searchParams.get('point_id') && {
      point_id: searchParams.get('point_id')!,
    }),
    ...(searchParams.get('type') && {
      type: searchParams.get('type')!,
    }),
    ...(params.is_state && { is_state: params.is_state }),

    ...(searchParams.get('from') && {
      from: searchParams.get('from')!,
    }),
    ...(searchParams.get('to') && {
      to: searchParams.get('to')!,
    }),

    limit: searchParams.get('limit') ?? '500',
  })

  const result = await backendFetch<PaginatedResult<Attendance>>(
    `/attendances?${query}`,
    { headers: { Authorization: auth } },
  )

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// POST /api/attendances — บันทึกการขึ้นรถ (RFID / QR scan)
export async function POST(request: Request) {
  const body = await request.json()
  // body: { rfid | employee_id, point_id, post_id, type: 'rfid'|'qr_code', remark? }

  const result = await backendFetch<Attendance>('/api/attendances', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!result.ok) return apiError(result.error, 422)
  return apiSuccess(result.data, 201)
}


