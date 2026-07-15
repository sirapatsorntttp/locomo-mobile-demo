import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import { toUserAccount } from '../_helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/users/${id}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toUserAccount(result.data))
}

// PATCH แยกตาม type — ส่ง type=employee หรือ type=driver ใน body
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const { type, ...rest } = body
  const path = type === 'driver' ? `/users/driver/${id}` : `/users/employee/${id}`

  const result = await backendFetch<any>(path, {
    method: 'PATCH',
    body: JSON.stringify(rest),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toUserAccount(result.data))
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
