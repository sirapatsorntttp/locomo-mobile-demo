import { backendFetch, apiSuccess, apiError } from '@/lib/api-config'

type Ctx = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params
  const auth = req.headers.get('Authorization') ?? ''

  const result = await backendFetch(`/drivers/${id}`, {
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()
  const auth = req.headers.get('Authorization') ?? ''

  const payload: Record<string, unknown> = {}

  if (body.code !== undefined) payload.code = body.code
  if (body.first_name_th !== undefined) payload.first_name_th = body.first_name_th
  if (body.last_name_th !== undefined) payload.last_name_th = body.last_name_th
  if (body.first_name_en !== undefined) payload.first_name_en = body.first_name_en
  if (body.last_name_en !== undefined) payload.last_name_en = body.last_name_en
  if (body.tel !== undefined) payload.tel = body.tel
  if (body.status !== undefined) payload.status = body.status
  if (body.is_status !== undefined) payload.status = body.is_status

  const result = await backendFetch(`/drivers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params
  const auth = req.headers.get('Authorization') ?? ''

  console.log('NEXT DELETE driver id:', id)

  const result = await backendFetch(`/drivers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })

  if (!result.ok) return apiError(result.error, result.status)
  return apiSuccess(result.data)
}