import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const { searchParams } = new URL(request.url)
  const qs = new URLSearchParams()
  if (searchParams.get('search'))               qs.set('search',               searchParams.get('search')!)
  if (searchParams.get('coordinator_type_id'))  qs.set('coordinator_type_id',  searchParams.get('coordinator_type_id')!)
  if (searchParams.get('company_id'))           qs.set('company_id',           searchParams.get('company_id')!)
  if (searchParams.get('status'))               qs.set('status',               searchParams.get('status')!)
  qs.set('limit', searchParams.get('limit') ?? '200')
  qs.set('page',  searchParams.get('page')  ?? '1')

  const result = await backendFetch(`/coordinators?${qs}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch('/coordinators', {
    method: 'POST',
    body: JSON.stringify({
      coordinator_type_id: body.coordinator_type_id,
      company_id:          body.company_id ?? null,
      name_th:             body.name_th,
      name_en:             body.name_en,
      tel:                 body.tel ?? null,
      email:               body.email ?? null,
      status:              body.status ?? body.is_status,
    }),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
