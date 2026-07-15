import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Shift } from '@/types'

function toShift(s: any): Shift {
  const sg = s.shiftGroups ?? s.shift_groups ?? null
  return {
    id: s.id,
    code: s.code,
    name_th: s.nameTh ?? s.name_th ?? '',
    name_en: s.nameEn ?? s.name_en ?? '',
    type: s.type,
    schedule: s.schedule,
    trip_direction: s.tripDirection ?? s.trip_direction ?? 'unknown',
    default_time: s.defaultTime ?? s.default_time ?? '',
    shift_group_id: s.shiftGroupId ?? s.shift_group_id ?? sg?.id ?? null,
    company_plant_id: s.companyPlantId ?? s.company_plant_id ?? null,
    is_status: s.status ?? s.is_status ?? 'active',
    created_by: s.createdBy ?? s.created_by ?? null,
    created_at: s.createdAt ? String(s.createdAt) : '',
    updated_by: s.updatedBy ?? s.updated_by ?? null,
    updated_at: s.updatedAt ? String(s.updatedAt) : null,
    shift_groups: sg
      ? {
          id: sg.id,
          code: sg.code,
          name_th: sg.nameTh ?? sg.name_th ?? '',
          name_en: sg.nameEn ?? sg.name_en ?? '',
          company_plant_id: sg.companyPlantId ?? sg.company_plant_id ?? null,
          is_status: sg.status ?? sg.is_status ?? 'active',
          created_by: sg.createdBy ?? sg.created_by ?? null,
          created_at: sg.createdAt ? String(sg.createdAt) : '',
          updated_by: sg.updatedBy ?? sg.updated_by ?? null,
          updated_at: sg.updatedAt ? String(sg.updatedAt) : null,
        }
      : null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''

  const query = new URLSearchParams()
  if (searchParams.get('id')) query.set('id', searchParams.get('id')!)
  if (searchParams.get('code')) query.set('code', searchParams.get('code')!)
  if (searchParams.get('name')) query.set('name', searchParams.get('name')!)
  if (searchParams.get('type')) query.set('type', searchParams.get('type')!)
  if (searchParams.get('schedule')) query.set('schedule', searchParams.get('schedule')!)
  if (searchParams.get('trip_direction')) query.set('trip_direction', searchParams.get('trip_direction')!)
  if (searchParams.get('company_plant_id')) query.set('company_plant_id', searchParams.get('company_plant_id')!)
  if (searchParams.get('status')) query.set('status', searchParams.get('status')!)
  query.set('limit', searchParams.get('limit') ?? '200')
  query.set('page', searchParams.get('page') ?? '1')

  const result = await backendFetch<{ total: number; data: any[] }>(
    `/shifts?${query}`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const { total, data } = result.data
  return apiSuccess({ total, data: data.map(toShift) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<any>('/shifts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth, 
    'Content-Type': 'application/json', },
    
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}