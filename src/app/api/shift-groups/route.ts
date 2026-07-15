import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { ShiftGroup } from '@/types'

function toShiftGroup(g: any): ShiftGroup {
  return {
    id: g.id,
    code: g.code,
    name_th: g.nameTh ?? g.name_th ?? '',
    name_en: g.nameEn ?? g.name_en ?? '',
    company_plant_id: g.companyPlantId ?? g.company_plant_id ?? null,
    is_status: g.status ?? g.is_status ?? 'active',
    created_by: g.createdBy ?? g.created_by ?? null,
    created_at: g.createdAt ? String(g.createdAt) : '',
    updated_by: g.updatedBy ?? g.updated_by ?? null,
    updated_at: g.updatedAt ? String(g.updatedAt) : null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id')) query.set('id', searchParams.get('id')!)
  if (searchParams.get('code')) query.set('code', searchParams.get('code')!)
  if (searchParams.get('name')) query.set('name', searchParams.get('name')!)
  if (searchParams.get('company_plant_id')) query.set('company_plant_id', searchParams.get('company_plant_id')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  query.set('limit', searchParams.get('limit') ?? '200')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/shift-groups?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const { total, data } = result.data
  return apiSuccess({ total, data: data.map(toShiftGroup) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/shift-groups', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}
