import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  
  const result = await backendFetch<any[]>('/dashboard/daily-vehicles', {
    headers: { Authorization: auth },
  })
  
  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}
