import type { Payload } from 'payload'
import type { TenantConfig } from '@/lib/tenant/types'

/**
 * Seed function for the fixture tenant.
 * Called by scripts/tenant-seed.ts as: pnpm tenant:seed __fixture__
 *
 * Creates or updates:
 *   - The tenant DB document
 *   - A home page with Hero + FeatureGrid blocks
 *   - An about page with RichText block
 */
export async function seed(payload: Payload, config: TenantConfig): Promise<void> {
  // Upsert the tenant document
  const existingTenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: config.slug } },
    limit: 1,
  })

  let tenantId: string

  if (existingTenants.docs.length > 0) {
    const updated = await payload.update({
      collection: 'tenants',
      id: existingTenants.docs[0].id,
      data: {
        name: config.name,
        slug: config.slug,
        domains: config.domains.map((domain) => ({ domain })),
        active: true,
      },
    })
    tenantId = updated.id
  } else {
    const created = await payload.create({
      collection: 'tenants',
      data: {
        name: config.name,
        slug: config.slug,
        domains: config.domains.map((domain) => ({ domain })),
        active: true,
      },
    })
    tenantId = created.id
  }

  // Upsert home page (English)
  const existingHome = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: 'home' } },
        { 'tenant.value': { equals: tenantId } },
      ],
    },
    locale: 'en',
    limit: 1,
  })

  const homeData = {
    title: 'Welcome — Fixture Tenant',
    slug: 'home',
    pageType: 'home' as const,
    layout: [
      {
        blockType: 'hero' as const,
        heading: 'Platform Scaffold Working',
        subheading: 'This is the Phase 1 fixture tenant. Replace with real content.',
        ctaLabel: 'Learn More',
        ctaHref: '/en/about',
        variant: 'centered' as const,
      },
      {
        blockType: 'featureGrid' as const,
        heading: 'Key Capabilities',
        columns: '3' as const,
        features: [
          { title: 'Multi-tenant', description: 'One codebase, many client sites.' },
          { title: 'i18n', description: 'German, English, Vietnamese out of the box.' },
          { title: 'On-demand ISR', description: 'Pages revalidate on content change.' },
        ],
      },
    ],
    meta: {
      title: 'Fixture Tenant — Home',
      description: 'Platform scaffold smoke test.',
    },
    tenant: { relationTo: 'tenants', value: tenantId },
    _status: 'published' as const,
  }

  if (existingHome.docs.length > 0) {
    await payload.update({ collection: 'pages', id: existingHome.docs[0].id, data: homeData, locale: 'en' })
  } else {
    await payload.create({ collection: 'pages', data: homeData, locale: 'en' })
  }

  // Upsert about page (English)
  const existingAbout = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: 'about' } },
        { 'tenant.value': { equals: tenantId } },
      ],
    },
    locale: 'en',
    limit: 1,
  })

  const aboutData = {
    title: 'About — Fixture Tenant',
    slug: 'about',
    pageType: 'about' as const,
    layout: [
      {
        blockType: 'richText' as const,
        content: { root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 } },
        maxWidth: 'prose' as const,
      },
    ],
    meta: { title: 'About — Fixture Tenant' },
    tenant: { relationTo: 'tenants', value: tenantId },
    _status: 'published' as const,
  }

  if (existingAbout.docs.length > 0) {
    await payload.update({ collection: 'pages', id: existingAbout.docs[0].id, data: aboutData, locale: 'en' })
  } else {
    await payload.create({ collection: 'pages', data: aboutData, locale: 'en' })
  }

  payload.logger.info(`✓ Fixture tenant seeded (id: ${tenantId})`)
}
