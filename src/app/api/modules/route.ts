import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

// ─── GET List ─────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()

  if (searchParams.get('search'))
    query.set('search', searchParams.get('search')!)

  if (searchParams.get('status'))
    query.set('status', searchParams.get('status')!)

  query.set('limit', searchParams.get('limit') ?? '500')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch(`/modules?${query}`, {
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// ─── POST Create ──────────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch('/modules', {
    method: 'POST',
    body: JSON.stringify({
      code: body.code,
      name_th: body.name_th,
      name_en: body.name_en,
      domain: body.domain,
      setting: body.setting,
      status: body.status,
    }),
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}