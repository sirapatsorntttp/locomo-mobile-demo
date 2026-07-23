import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { CompanyVendor } from '@/types'

// GET  /api/companies/[id]/vendors — list vendors assigned to this company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<CompanyVendor[]>(
    `/companies/${id}/vendors`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// POST /api/companies/[id]/vendors — assign vendor to company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<CompanyVendor>(
    `/companies/${id}/vendors`,
    {
      method: 'POST',
      body: JSON.stringify({ vendor_id: body.vendor_id }),
      headers: { Authorization: auth },
    },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}

// DELETE /api/companies/[id]/vendors?vendor_id=xxx
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url)
  const vendor_id = searchParams.get('vendor_id')
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  if (!vendor_id) return apiError('vendor_id is required', 400)

  const result = await backendFetch<void>(
    `/companies/${id}/vendors/${vendor_id}`,
    { method: 'DELETE', headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
