import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractDevPreviewDomain } from '@/lib/tenant/resolveTenant'

// Paths that bypass all tenant logic and are passed through unchanged.
const PASSTHROUGH_PREFIXES = ['/admin', '/api/', '/_next/', '/favicon.ico', '/robots.txt', '/sitemap.xml']

function isPassthrough(pathname: string): boolean {
  return PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Middleware — the most important file in the system.
 *
 * Responsibilities:
 *   1. Pass /admin, /api/*, and Next.js internals through unchanged.
 *   2. Dev only: parse `/tenant/<domain>/...` prefix, strip it, inject the domain
 *      as `x-tenant-domain` header so the page component can resolve the tenant.
 *   3. Prod: forward the Host header as `x-tenant-domain`.
 *   4. Reject `/tenant/...` requests in production with 404.
 *
 * The middleware does NOT load the full TenantConfig — that happens server-side
 * in page components (Node.js runtime, has access to the static registry).
 * Keeping the middleware thin ensures it stays Edge-compatible and fast.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProd = process.env.NODE_ENV === 'production'

  // ── 1. Pass through admin, API, and Next.js internal paths ──────────────
  if (isPassthrough(pathname)) {
    return NextResponse.next()
  }

  // ── 2. Block /tenant/... in production ────────────────────────────────────
  if (isProd && pathname.startsWith('/tenant/')) {
    return new NextResponse(null, { status: 404 })
  }

  // ── 3. Dev-only: parse /tenant/<domain>/... prefix ────────────────────────
  // Example: /tenant/__fixture__.test/en/about
  //   → sets x-tenant-domain: __fixture__.test
  //   → rewrites to /en/about
  if (!isProd && pathname.startsWith('/tenant/')) {
    const domain = extractDevPreviewDomain(pathname)
    if (!domain) {
      return new NextResponse(null, { status: 404 })
    }

    // Strip the /tenant/<domain> prefix to get the real path
    const restPath = pathname.replace(/^\/tenant\/[^/]+/, '') || '/'

    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = restPath

    const response = NextResponse.rewrite(rewriteUrl)
    // Inject resolved domain so the page component knows which tenant to load.
    response.headers.set('x-tenant-domain', domain)
    return response
  }

  // ── 4. Normal production / dev path: use Host header ─────────────────────
  // Strip port from Host so `localhost:3000` → `localhost` etc.
  // The page component does further resolution (www stripping, config lookup).
  const host = request.headers.get('host') ?? ''
  const response = NextResponse.next()
  if (host) {
    response.headers.set('x-tenant-domain', host)
  }

  return response
}

export const config = {
  // Match all paths except static files. Middleware is cheap here because the
  // passthrough check exits early for _next/static and similar.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
