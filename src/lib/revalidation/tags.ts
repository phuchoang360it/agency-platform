/**
 * Canonical tag builder for Next.js cache invalidation.
 *
 * Tags are hierarchical strings that allow surgical revalidation:
 *   - `tenant:acme`              → all pages for tenant "acme"
 *   - `tenant:acme:de`           → all German pages for acme
 *   - `tenant:acme:de:/about`    → the single German /about page for acme
 *
 * Revalidation uses `revalidateTag(tag)`, which invalidates all cached
 * responses that were tagged with that exact string.
 */

export function buildTag(tenantSlug: string, locale?: string, slug?: string): string {
  // Always start with the tenant root tag so a full-tenant purge works.
  let tag = `tenant:${tenantSlug}`
  if (locale) {
    tag += `:${locale}`
    if (slug) {
      // Normalise slug: ensure leading slash, no trailing slash.
      const normSlug = '/' + slug.replace(/^\//, '').replace(/\/$/, '')
      tag += `:${normSlug}`
    }
  }
  return tag
}

/**
 * Expand a tenant+locale pair into all tags that should be invalidated
 * when any page for that locale changes. Used by collection hooks.
 */
export function buildRevalidationTags(
  tenantSlug: string,
  locales: string[],
  slugs?: string[],
): string[] {
  const tags: string[] = [`tenant:${tenantSlug}`]
  for (const locale of locales) {
    tags.push(buildTag(tenantSlug, locale))
    if (slugs) {
      for (const slug of slugs) {
        tags.push(buildTag(tenantSlug, locale, slug))
      }
    }
  }
  return tags
}
