import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { CompanyPlantEmployee } from '@/types'

// GET  /api/companies/[id]/plants/[plant_id]/employees
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; plant_id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id, plant_id } = await params

  const result = await backendFetch<CompanyPlantEmployee[]>(
    `/companies/${id}/plants/${plant_id}/employees`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// POST /api/companies/[id]/plants/[plant_id]/employees — assign employee
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; plant_id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id, plant_id } = await params

  const result = await backendFetch<CompanyPlantEmployee>(
    `/companies/${id}/plants/${plant_id}/employees`,
    {
      method: 'POST',
      body: JSON.stringify({ employee_id: body.employee_id }),
      headers: { Authorization: auth },
    },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}

// DELETE /api/companies/[id]/plants/[plant_id]/employees?employee_id=xxx
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; plant_id: string }> },
) {
  const { searchParams } = new URL(request.url)
  const employee_id = searchParams.get('employee_id')
  const auth = request.headers.get('Authorization') ?? ''
  const { id, plant_id } = await params

  if (!employee_id) return apiError('employee_id is required', 400)

  const result = await backendFetch<void>(
    `/companies/${id}/plants/${plant_id}/employees/${employee_id}`,
    { method: 'DELETE', headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
