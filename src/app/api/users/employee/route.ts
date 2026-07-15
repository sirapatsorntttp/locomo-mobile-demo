import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'
import { toUserAccount } from '../_helpers'

// POST /api/users/employee — สร้าง user account สำหรับ employee
export async function POST(request: Request) {
  const body = await request.json()
  const auth = request.headers.get('Authorization') ?? ''

  // body: { employeeId, roleIds?, username, password, language?, status? }
  const result = await backendFetch<any>('/users/employee', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(toUserAccount(result.data), 201)
}
