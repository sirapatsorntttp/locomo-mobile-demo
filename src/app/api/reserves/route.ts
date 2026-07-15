import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { PaginatedResult, Reserve } from '@/types'

// GET /api/reserves
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  query.set('page',     searchParams.get('page')     ?? '1')
  query.set('per_page', searchParams.get('per_page') ?? '200')
  if (searchParams.get('employee_id')) query.set('employee_id', searchParams.get('employee_id')!)
  if (searchParams.get('shift_id'))    query.set('shift_id',    searchParams.get('shift_id')!)
  if (searchParams.get('route_id'))    query.set('route_id',    searchParams.get('route_id')!)
  if (searchParams.get('point_id'))    query.set('point_id',    searchParams.get('point_id')!)
  if (searchParams.get('date_from'))   query.set('date_from',   searchParams.get('date_from')!)
  if (searchParams.get('date_to'))     query.set('date_to',     searchParams.get('date_to')!)
  if (searchParams.get('is_state'))    query.set('is_state',    searchParams.get('is_state')!)

  const result = await backendFetch<PaginatedResult<Reserve>>(`/reserves?${query}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// POST /api/reserves
export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<Reserve>('/reserves', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
