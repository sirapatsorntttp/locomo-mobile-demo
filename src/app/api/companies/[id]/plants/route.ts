import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { CompanyPlant } from '@/types'

// GET  /api/companies/[id]/plants — list plants for this company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<CompanyPlant[]>(
    `/companies/${id}/plants`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// POST /api/companies/[id]/plants — assign plant to company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<CompanyPlant>(
    `/companies/${id}/plants`,
    {
      method: 'POST',
      body: JSON.stringify({ plant_id: body.plant_id }),
      headers: { Authorization: auth },
    },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}

// DELETE /api/companies/[id]/plants?plant_id=xxx — remove plant
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url)
  const plant_id = searchParams.get('plant_id')
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  if (!plant_id) return apiError('plant_id is required', 400)

  const result = await backendFetch<void>(
    `/companies/${id}/plants/${plant_id}`,
    { method: 'DELETE', headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
