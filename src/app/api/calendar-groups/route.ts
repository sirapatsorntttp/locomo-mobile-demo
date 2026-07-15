import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

function toFront(g: any) {
  if (!g) return g
  const { company_plant_id, ...rest } = g
  return { ...rest, company_plant_id, plant_company_id: company_plant_id }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  // frontend sends plant_company_id → backend expects company_plant_id
  const pcId = searchParams.get('plant_company_id') ?? searchParams.get('company_plant_id')
  if (pcId)                        query.set('company_plant_id', pcId)
  if (searchParams.get('search'))  query.set('search', searchParams.get('search')!)
  query.set('limit', searchParams.get('limit') ?? searchParams.get('per_page') ?? '500')
  query.set('page',  searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/calendar-groups?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)

  const mapped = {
    total: result.data.total,
    data:  (result.data.data ?? []).map(toFront),
  }
  return apiSuccess(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/calendar-groups', {
    method: 'POST',
    body: JSON.stringify({
      company_plant_id: body.plant_company_id ?? body.company_plant_id,
      name:             body.name,
      color:            body.color,
      description:      body.description ?? null,
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toFront(result.data), 201)
}
