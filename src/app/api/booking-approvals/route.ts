import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('status'))     query.set('status',     searchParams.get('status')!)
  if (searchParams.get('reserve_id')) query.set('reserve_id', searchParams.get('reserve_id')!)
  query.set('limit', searchParams.get('limit') ?? '50')
  query.set('page',  searchParams.get('page')  ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/booking-approvals?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/booking-approvals', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
