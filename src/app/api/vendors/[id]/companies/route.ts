import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { CompanyVendor } from '@/types'

// GET  /api/vendors/[id]/companies — get company assigned to this vendor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<CompanyVendor>(
    `/vendors/${id}/companies`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// POST /api/vendors/[id]/companies — assign vendor to a company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<CompanyVendor>(
    `/vendors/${id}/companies`,
    {
      method: 'POST',
      body: JSON.stringify({ company_id: body.company_id }),
      headers: { Authorization: auth },
    },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data, 201)
}

// DELETE /api/vendors/[id]/companies — remove company assignment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params

  const result = await backendFetch<void>(
    `/vendors/${id}/companies`,
    { method: 'DELETE', headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
