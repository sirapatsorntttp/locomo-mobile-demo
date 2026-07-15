import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import type { Reserve } from '@/types'

// PATCH /api/reserves/:id — update state or remark
export async function PATCH(request: Request, 
 { params }: { params: Promise<{ id: string }> }   
) {
  const { id } = await params  

  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<Reserve>(`/reserves/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

// DELETE /api/reserves/:id — soft cancel
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = request.headers.get('Authorization') ?? ''

  const result = await backendFetch<Reserve>(`/reserves/${params.id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
