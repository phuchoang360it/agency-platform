import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { buildRevalidationTags } from '@/lib/revalidation/tags'
import { loadTenantConfig } from '@/lib/tenant/loadTenantConfig'
import { isSupportedLocale } from '@/lib/i18n/locales'

// External revalidation endpoint. Called by webhooks or CI to flush cached pages.
// Payload collection hooks use revalidateTag() directly (no HTTP round-trip).
//
// POST /api/revalidate
// Headers: Authorization: Bearer <REVALIDATE_SECRET>
// Body: { tenantSlug, locales?, slugs? }

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET
  const auth = request.headers.get('authorization')

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { tenantSlug?: unknown; locales?: unknown; slugs?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const tenantSlug = typeof body.tenantSlug === 'string' ? body.tenantSlug : null
  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 })
  }

  const config = loadTenantConfig(tenantSlug)
  if (!config) {
    return NextResponse.json({ error: `Tenant "${tenantSlug}" not found` }, { status: 404 })
  }

  // Resolve locales: use provided subset or fall back to all enabled locales.
  const requestedLocales = Array.isArray(body.locales) ? body.locales.filter(isSupportedLocale) : null
  const locales = requestedLocales && requestedLocales.length > 0
    ? requestedLocales
    : config.locales.enabled

  const slugs = Array.isArray(body.slugs)
    ? body.slugs.filter((s): s is string => typeof s === 'string')
    : undefined

  const tags = buildRevalidationTags(tenantSlug, locales, slugs)

  const bust = revalidateTag as (t: string) => void
  for (const tag of tags) bust(tag)

  return NextResponse.json({ revalidated: true, tags })
}
