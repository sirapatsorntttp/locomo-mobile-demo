import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

// Response → camelCase (for GET list)
function fromRole(data: any) {
  return {
    id:       data.id,
    nameTh:   data.name_th  ?? data.nameTh  ?? '',
    nameEn:   data.name_en  ?? data.nameEn  ?? '',
    roleType: data.type      ?? data.roleType ?? '',
    status:   data.is_status ?? data.status  ?? '',
  }
}

// Request body → snake_case (for POST/PATCH to backend)
function toRole(body: any) {
  return {
    ...(body.nameTh    != null && { name_th:   body.nameTh }),
    ...(body.nameEn    != null && { name_en:   body.nameEn }),
    ...(body.roleType  != null && { type:      body.roleType }),
    ...(body.status    != null && { is_status: body.status }),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id'))     query.set('id',     searchParams.get('id')!)
  if (searchParams.get('name'))   query.set('name',   searchParams.get('name')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  query.set('limit', searchParams.get('limit') ?? '100')
  query.set('page',  searchParams.get('page')  ?? '1')

  const result = await backendFetch<any>(`/roles?${query}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)

  const raw = result.data
  const items: any[] = raw?.data ?? (Array.isArray(raw) ? raw : [])
  return apiSuccess({ data: items.map(fromRole), total: raw?.total ?? items.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/roles', {
    method: 'POST',
    body: JSON.stringify(toRole(body)),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
