/**
 * Camera image / MJPEG proxy
 * Adds Referer: https://traffic.longdo.com/ so iticfoundation.org serves the frames.
 *
 * Usage:
 *   /api/cam-proxy?url=<encoded-camera-url>
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('url')

  if (!target) {
    return new Response('Missing url param', { status: 400 })
  }

  // Only allow camera hosts to prevent open-proxy abuse
  let parsedUrl: URL
  try {
    parsedUrl = new URL(target)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  const ALLOWED_HOSTS = ['camera1.iticfoundation.org', 'camerai1.iticfoundation.org']
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return new Response('Host not allowed', { status: 403 })
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        Referer: 'https://traffic.longdo.com/',
        Origin: 'https://traffic.longdo.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/*,*/*',
      },
      // No signal — MJPEG streams are long-lived; let the browser close the connection
    })

    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, { status: 502 })
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'proxy error'
    return new Response(msg, { status: 502 })
  }
}
