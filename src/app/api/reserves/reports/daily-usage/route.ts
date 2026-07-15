import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()

  if (searchParams.get('from'))
    query.set('from', searchParams.get('from')!)

  if (searchParams.get('to'))
    query.set('to', searchParams.get('to')!)

  const result = await backendFetch(
    `/reserves/reports/daily-usage?${query}`,
    { headers: { Authorization: auth } },
  )

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
