export const dynamic = 'force-dynamic'

import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

function fromModule(m: any) {
  return {
    id:     m.id,
    code:   m.code,
    nameTh: m.name_th,
    nameEn: m.name_en,
    domain: m.domain,
    status: m.is_status,
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const result = await backendFetch<any[]>('/sys-modules', {
    headers: { Authorization: auth },
  })
  if (!result.ok) return apiError(result.error, result.status)
  const raw = result.data
  const items: any[] = Array.isArray(raw) ? raw : (raw as any)?.data ?? []
  return apiSuccess(items.map(fromModule))
}
