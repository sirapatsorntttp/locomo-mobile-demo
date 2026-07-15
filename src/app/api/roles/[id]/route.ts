import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

function fromRole(data: any) {
  return {
    id:       data.id,
    nameTh:   data.name_th  ?? data.nameTh  ?? '',
    nameEn:   data.name_en  ?? data.nameEn  ?? '',
    roleType: data.type      ?? data.roleType ?? '',
    status:   data.is_status ?? data.status  ?? '',
  }
}

function toRole(body: any) {
  return {
    ...(body.nameTh    != null && { name_th:   body.nameTh }),
    ...(body.nameEn    != null && { name_en:   body.nameEn }),
    ...(body.roleType  != null && { type:      body.roleType }),
    ...(body.status    != null && { is_status: body.status }),
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/roles/${id}`, { headers: { Authorization: auth } })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toRole(body)),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id } = await params
  const result = await backendFetch<any>(`/roles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
