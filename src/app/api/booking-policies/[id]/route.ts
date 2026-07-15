import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch<any>(`/booking-policies/${id}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch<any>(`/booking-policies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch<any>(`/booking-policies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(null)
}
