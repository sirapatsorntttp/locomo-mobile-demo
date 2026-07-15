import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const { searchParams } = new URL(request.url)
  const qs = new URLSearchParams()
  if (searchParams.get('search')) qs.set('search', searchParams.get('search')!)
  if (searchParams.get('status')) qs.set('status', searchParams.get('status')!)
  qs.set('limit', searchParams.get('limit') ?? '200')
  qs.set('page',  searchParams.get('page')  ?? '1')

  const result = await backendFetch(`/coordinator-types?${qs}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch('/coordinator-types', {
    method: 'POST',
    body: JSON.stringify({
      name_th: body.name_th,
      name_en: body.name_en,
      status:  body.status ?? body.is_status,
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
