export const dynamic = 'force-dynamic'

import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('result'))    query.set('result',    searchParams.get('result')!)
  if (searchParams.get('event'))     query.set('event',     searchParams.get('event')!)
  if (searchParams.get('user_id'))   query.set('user_id',   searchParams.get('user_id')!)
  if (searchParams.get('date_from')) query.set('date_from', searchParams.get('date_from')!)
  if (searchParams.get('date_to'))   query.set('date_to',   searchParams.get('date_to')!)
  query.set('limit', searchParams.get('limit') ?? '100')
  query.set('page',  searchParams.get('page')  ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/auth/logs?${query}`,
    { headers: { Authorization: auth } },
  )

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
