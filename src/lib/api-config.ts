/**
 * API configuration
 * ตั้งค่า base URL ของ PHP backend ใน .env.local:
 *   BACKEND_URL=http://your-php-backend.com
 */

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000'
export const API_TIMEOUT = 10_000 // 10 seconds

function formatBackendError(body: any, fallback: string) {
  const message = body?.message?.en ?? body?.message?.th ?? body?.message ?? body?.error ?? fallback

  if (!Array.isArray(body?.errors) || body.errors.length === 0) {
    return message
  }

  const details = body.errors
    .map((error: any) => {
      const messages = Array.isArray(error?.messages) ? error.messages.join(', ') : error?.messages
      return [error?.field, messages].filter(Boolean).join(': ')
    })
    .filter(Boolean)
    .join('; ')

  return details ? `${message}: ${details}` : message
}

/**
 * Base fetch wrapper สำหรับเรียก PHP backend
 * ใช้ใน Next.js API Routes (server-side only)
 */
export async function backendFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T; ok: true; status: number } | { error: string; ok: false; status: number }> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options?.headers ?? {}),
      },
      signal: AbortSignal.timeout(API_TIMEOUT),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message = formatBackendError(body, `HTTP ${res.status}`)
      return { ok: false, error: message, status: res.status }
    }

    const data = await res.json()
    const unwrapped = data && typeof data === 'object' && 'body' in data ? data.body : data
    return { ok: true, data: unwrapped as T, status: res.status }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Network error', status: 500 }
  }
}

/**
 * สร้าง NextResponse JSON helper
 */
export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: unknown, status = 500) {
  return Response.json({ success: false, error: message }, { status })
}

/**
 * Parse query params helper
 */
export function parseSearchParams(url: string) {
  const { searchParams } = new URL(url)
  return {
    page: Number(searchParams.get('page') ?? 1),
    per_page: Number(searchParams.get('per_page') ?? 20),
    search: searchParams.get('search') ?? '',
    is_status: searchParams.get('is_status') ?? '',
    // Reserves
    date_from: searchParams.get('date_from') ?? '',
    date_to: searchParams.get('date_to') ?? '',
    shift_id: searchParams.get('shift_id') ?? '',
    route_id: searchParams.get('route_id') ?? '',
    point_id: searchParams.get('point_id') ?? '',
    is_state: searchParams.get('is_state') ?? '',
    // Employees
    division_id: searchParams.get('division_id') ?? '',
    department_id: searchParams.get('department_id') ?? '',
    section_id: searchParams.get('section_id') ?? '',
    level_id: searchParams.get('level_id') ?? '',
  }
}
