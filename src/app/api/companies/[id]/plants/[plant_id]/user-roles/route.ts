import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

function fromUserWithRoles(u: any) {
  return {
    employeeId: u.employeeId,
    code:        u.code        ?? '',
    firstNameTh: u.firstNameTh ?? null,
    lastNameTh:  u.lastNameTh  ?? null,
    firstNameEn: u.firstNameEn ?? null,
    lastNameEn:  u.lastNameEn  ?? null,
    email:       u.email       ?? null,
    userId:      u.userId      ?? null,
    username:    u.username    ?? null,
    userStatus:  u.userStatus  ?? null,
    roles: Array.isArray(u.roles) ? u.roles : [],
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; plant_id: string }> },
) {
  const auth = request.headers.get('Authorization') ?? ''
  const { id, plant_id } = await params
  const result = await backendFetch<any[]>(
    `/companies/${id}/plants/${plant_id}/user-roles`,
    { headers: { Authorization: auth } },
  )
  if (!result.ok) return apiError(result.error, result.status)
  const items: any[] = Array.isArray(result.data) ? result.data : (result.data as any)?.data ?? []
  return apiSuccess(items.map(fromUserWithRoles))
}
