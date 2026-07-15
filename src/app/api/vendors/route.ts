import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Vendor } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('search'))    query.set('search',    searchParams.get('search')!)
  if (searchParams.get('code'))      query.set('code',      searchParams.get('code')!)
  if (searchParams.get('is_status')) query.set('status',    searchParams.get('is_status')!)
  query.set('limit', searchParams.get('limit') ?? searchParams.get('per_page') ?? '200')
  query.set('page',  searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: Vendor[] }>(
    `/vendors?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<Vendor>('/vendors', {
    method: 'POST',
    body: JSON.stringify({
      code:    body.code,
      name_th: body.name_th,
      name_en: body.name_en,
      status:  body.is_status ?? 'active',
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
