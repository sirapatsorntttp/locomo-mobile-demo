import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch<any>(`/comments/${params.id}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch<any>(`/comments/${params.id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch<any>(`/comments/${params.id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
