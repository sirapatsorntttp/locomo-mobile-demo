import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const { searchParams } = new URL(request.url)
  const qs = new URLSearchParams()
  if (searchParams.get('company_plant_id')) qs.set('company_plant_id', searchParams.get('company_plant_id')!)

  const result = await backendFetch(`/organization/levels?${qs}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch('/organization/levels', {
    method: 'POST',
    body: JSON.stringify({
      company_plant_id: body.company_plant_id,
      code:             body.code,
      name_th:          body.name_th,
      name_en:          body.name_en,
      level:            body.level,
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
