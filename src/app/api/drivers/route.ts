import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id'))        query.set('id', searchParams.get('id')!)
  if (searchParams.get('code'))      query.set('code', searchParams.get('code')!)
  if (searchParams.get('name'))      query.set('name', searchParams.get('name')!)
  if (searchParams.get('vendor_id')) query.set('vendor_id', searchParams.get('vendor_id')!)
  if (searchParams.get('status'))    query.set('status', searchParams.get('status')!)
  query.set('limit', searchParams.get('limit') ?? '500')
  query.set('page',  searchParams.get('page') ?? '1')

  const result = await backendFetch(`/drivers?${query}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch('/drivers', {
    method: 'POST',
    body: JSON.stringify({
      code:          body.code,
      first_name_th: body.first_name_th,
      last_name_th:  body.last_name_th,
      first_name_en: body.first_name_en,
      last_name_en:  body.last_name_en,
      tel:           body.tel ?? null,
      status:        body.status ?? 'active',
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}