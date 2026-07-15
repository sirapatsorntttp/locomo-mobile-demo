import { BACKEND_URL } from '@/lib/api-config'
import { apiError } from '@/lib/api-config'

const ALLOWED_TYPES = ['organizations', 'route-point', 'employees']

export async function POST(
  request: Request,
  { params }: { params: { type: string } },
) {
  const { type } = params
  if (!ALLOWED_TYPES.includes(type)) {
    return apiError('Invalid upload type', 400)
  }

  const auth = request.headers.get('Authorization') ?? ''

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return apiError('Invalid form data', 400)
  }

  try {
    const res = await fetch(`${BACKEND_URL}/upload-files/${type}`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: auth },
      // No Content-Type — let Node set multipart boundary automatically
      signal: AbortSignal.timeout(75_000),
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      const message =
        body?.message?.en ?? body?.message?.th ?? body?.message ?? `HTTP ${res.status}`
      return apiError(message, res.status)
    }

    return Response.json({ success: true, data: body }, { status: 200 })
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      return apiError('Upload timeout — file is too large or server is busy', 408)
    }
    return apiError(err?.message ?? 'Network error', 500)
  }
}