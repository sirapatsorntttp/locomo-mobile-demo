import { apiSuccess, apiError } from '@/lib/api-config'

export const revalidate = 300 // cache 5 minutes

export async function GET() {
  try {
    const res = await fetch('https://traffic.longdo.com/camera.json', {
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://traffic.longdo.com/',
        'Origin': 'https://traffic.longdo.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return apiError(`Upstream error ${res.status}`, 502)
    const data = await res.json() as { item?: Record<string, string>[] }
    const validCameras = (data.item ?? []).filter(c =>
      c.imgurl && !c.imgurl.includes('X.X.X.X') &&
      c.vdourl && !c.vdourl.includes('X.X.X.X')
    ).map(c => ({
      ...c,
      hls_url: c.vdourl?.includes('iticfoundation.org') ? c.vdourl : undefined,
    }))
    return apiSuccess(validCameras)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return apiError(msg, 500)
  }
}
