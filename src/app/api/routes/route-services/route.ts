import { apiError, apiSuccess, backendFetch } from "@/lib/api-config"
import { RouteServiceItem } from "@/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const date = searchParams.get('date')
  if (!date) return apiError('date is required', 400)

  const query = new URLSearchParams()
  query.set('date', date)

  const result = await backendFetch<{ data: RouteServiceItem[] }>(
    `/routes/route-services?${query}`,
    { headers: { Authorization: auth } },
  )

  if (!result.ok) return apiError(result.error, result.status)

  return apiSuccess({ data: result.data.data })
}
