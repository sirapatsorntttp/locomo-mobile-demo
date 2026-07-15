import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

function toFront(c: any) {
  if (!c) return c
  const { company_plant_id, ...rest } = c
  const date_at = rest.date_at
    ? (typeof rest.date_at === 'string' ? rest.date_at.slice(0, 10) : new Date(rest.date_at).toISOString().slice(0, 10))
    : rest.date_at
  const type = typeof rest.type === 'string' ? rest.type.toLowerCase() : rest.type
  return { ...rest, type, date_at, company_plant_id, plant_company_id: company_plant_id }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  const pcId = searchParams.get('plant_company_id') ?? searchParams.get('company_plant_id')
  if (pcId)                                    query.set('company_plant_id',  pcId)
  if (searchParams.get('calendar_group_id'))   query.set('calendar_group_id', searchParams.get('calendar_group_id')!)
  if (searchParams.get('date_from'))           query.set('date_from',         searchParams.get('date_from')!)
  if (searchParams.get('date_to'))             query.set('date_to',           searchParams.get('date_to')!)
  if (searchParams.get('type'))                query.set('type',              searchParams.get('type')!)
  query.set('limit', searchParams.get('limit') ?? searchParams.get('per_page') ?? '1000')
  query.set('page',  searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/calendars?${query}`,
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

  const result = await backendFetch<any>('/calendars', {
    method: 'POST',
    body: JSON.stringify({
      company_plant_id:  body.plant_company_id ?? body.company_plant_id,
      calendar_group_id: body.calendar_group_id || null,
      name_th:           body.name_th,
      name_en:           body.name_en ?? body.name_th,
      date_at:           body.date_at,
      type:              body.type ?? 'holiday',
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toFront(result.data), 201)
}
