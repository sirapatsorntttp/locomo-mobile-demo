import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import { toEmployee, fromEmployee } from './_helpers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id'))               query.set('id',               searchParams.get('id')!)
  if (searchParams.get('code'))             query.set('code',             searchParams.get('code')!)
  if (searchParams.get('name'))             query.set('name',             searchParams.get('name')!)
  if (searchParams.get('status'))           query.set('status',           searchParams.get('status')!)
  if (searchParams.get('company_plant_ids')) query.set('company_plant_ids', searchParams.get('company_plant_ids')!)
  query.set('limit', searchParams.get('limit') ?? '200')
  query.set('page',  searchParams.get('page')  ?? '1')

  const result = await backendFetch<any>(`/employees?${query}`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)

  const raw = result.data
  const items: any[] = raw?.data ?? (Array.isArray(raw) ? raw : [])
  return apiSuccess({ data: items.map(toEmployee), total: raw?.total ?? items.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const payload: any = fromEmployee(body)
  if (body.company_plant_id) payload.company_plant_id = body.company_plant_id

  const result = await backendFetch<any>('/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toEmployee(result.data), 201)
}
