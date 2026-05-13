import type { Payload } from 'payload'
import type { TenantConfig } from '@/lib/tenant/types'

export async function seed(payload: Payload, config: TenantConfig): Promise<void> {
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
    tenantId = String(updated.id)
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
    tenantId = String(created.id)
  }

  const upsertPage = async (slugStr: string, locale: 'en' | 'de', data: Record<string, unknown>) => {
    const existing = await payload.find({
      collection: 'pages',
      where: { and: [{ slug: { equals: slugStr } }, { tenant: { equals: tenantId } }] },
      locale,
      limit: 1,
    })
    if (existing.docs.length > 0) {
      await payload.update({ collection: 'pages', id: existing.docs[0].id, data, locale })
    } else {
      await payload.create({ collection: 'pages', data, locale })
    }
  }

  const tenant = Number(tenantId)

  await upsertPage('home', 'en', {
    title: 'Welcome — Fixture Tenant',
    slug: 'home',
    pageTemplate: 'home',
    heroSection: {
      heading: 'Platform Scaffold Working',
      subheading: 'This is the Phase 1 fixture tenant. Replace with real content.',
      ctaLabel: 'Learn More',
      ctaHref: '/en/about',
    },
    featuresSection: {
      heading: 'Key Capabilities',
      features: [
        { title: 'Multi-tenant', description: 'One codebase, many client sites.' },
        { title: 'i18n', description: 'German, English, Vietnamese out of the box.' },
        { title: 'On-demand ISR', description: 'Pages revalidate on content change.' },
      ],
    },
    meta: { title: 'Fixture Tenant — Home', description: 'Platform scaffold smoke test.' },
    tenant,
    _status: 'published' as const,
  })

  await upsertPage('about', 'en', {
    title: 'About — Fixture Tenant',
    slug: 'about',
    pageTemplate: 'about',
    heroSection: { heading: 'About Fixture Tenant', subheading: 'Testing scaffold.' },
    bodyContent: {
      root: {
        type: 'root',
        children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'Fixture about page content.' }] }],
        direction: 'ltr', format: '', indent: 0, version: 1,
      },
    },
    meta: { title: 'About — Fixture Tenant' },
    tenant,
    _status: 'published' as const,
  })

  payload.logger.info(`✓ Fixture tenant seeded (id: ${tenantId})`)
}
