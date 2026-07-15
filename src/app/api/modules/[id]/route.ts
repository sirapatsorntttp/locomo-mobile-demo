import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

// ─── GET By ID ────────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/modules/${id}`, {
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// ─── PATCH Update ─────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/modules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(body.code !== undefined && { code: body.code }),
      ...(body.name_th !== undefined && { name_th: body.name_th }),
      ...(body.name_en !== undefined && { name_en: body.name_en }),
      ...(body.domain !== undefined && { domain: body.domain }),
      ...(body.setting !== undefined && { setting: body.setting }),
      ...(body.status !== undefined && { status: body.status }),
    }),
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// ─── DELETE Soft Delete ───────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/modules/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}