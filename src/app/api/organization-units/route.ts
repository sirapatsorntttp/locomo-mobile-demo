import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const { searchParams } = new URL(request.url)
  const qs = new URLSearchParams()
  if (searchParams.get('company_plant_id')) qs.set('company_plant_id', searchParams.get('company_plant_id')!)
  if (searchParams.get('search'))           qs.set('search',           searchParams.get('search')!)

  const result = await backendFetch(`/organization/units?${qs}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch('/organization/units', {
    method: 'POST',
    body: JSON.stringify({
      company_plant_id:      body.company_plant_id,
      organization_level_id: body.level_id,
      parent_id:             body.parent_id ?? null,
      code:                  body.code,
      name_th:               body.name_th,
      name_en:               body.name_en,
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
