export const dynamic = 'force-dynamic'

import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<string[]>(`/roles/${id}/modules`, {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)

  const ids: string[] = Array.isArray(result.data) ? result.data : []
  return apiSuccess(ids)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const auth = request.headers.get('Authorization') ?? ''
  const body = await request.json()

  const result = await backendFetch<void>(`/roles/${id}/modules`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(null)
}
