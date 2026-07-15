import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import { toEmployee, fromEmployee } from '../_helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/employees/${id}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toEmployee(result.data))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fromEmployee(body)),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toEmployee(result.data))
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/employees/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
