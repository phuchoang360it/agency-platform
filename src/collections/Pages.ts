import type { CollectionConfig } from 'payload'
import { buildRevalidationTags } from '@/lib/revalidation/tags'
import { loadTenantConfig } from '@/lib/tenant/loadTenantConfig'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Server-side revalidation: call revalidateTag without an HTTP round-trip.
// import is deferred to avoid pulling next/cache into non-Next.js contexts.
const afterChangePage: CollectionAfterChangeHook = async ({ doc }) => {
  try {
    const { revalidateTag } = await import('next/cache')
    const tenantSlug: string = doc?.tenant?.value?.slug ?? doc?.tenant?.slug ?? ''
    if (!tenantSlug) return doc

    const tenantConfig = loadTenantConfig(tenantSlug)
    const locales = tenantConfig?.locales.enabled ?? ['en']
    const slug: string = doc?.slug ?? ''

    const tags = buildRevalidationTags(tenantSlug, locales, slug ? [slug] : undefined)
    const bust = revalidateTag as (t: string) => void
    for (const tag of tags) bust(tag)
  } catch {
    // next/cache unavailable outside Next.js runtime (e.g. seed scripts)
  }
  return doc
}

const afterDeletePage: CollectionAfterDeleteHook = async ({ doc }) => {
  try {
    const { revalidateTag } = await import('next/cache')
    const tenantSlug: string = doc?.tenant?.value?.slug ?? doc?.tenant?.slug ?? ''
    if (!tenantSlug) return doc

    const tenantConfig = loadTenantConfig(tenantSlug)
    const locales = tenantConfig?.locales.enabled ?? ['en']
    const tags = buildRevalidationTags(tenantSlug, locales)
    const bust = revalidateTag as (t: string) => void
    for (const tag of tags) bust(tag)
  } catch {
    // next/cache unavailable outside Next.js runtime
  }
  return doc
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'pageTemplate', 'updatedAt'],
    description: 'Content pages scoped to a tenant. One page per locale variant is stored.',
    livePreview: {
      url: ({ data, locale }) => {
        const id = data?.id
        if (!id) return null
        const localeCode = locale?.code ?? 'en'
        const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        return `${serverUrl}/preview?id=${id}&locale=${localeCode}`
      },
    },
  },
  versions: {
    drafts: {
      autosave: { interval: 375 },
    },
  },
  fields: [
    {
      name: 'tenantBreadcrumb',
      type: 'ui',
      admin: {
        components: {
          Field: 'components/payloadCMS/TenantBreadcrumb#TenantBreadcrumb',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'heroSection',
              type: 'group',
              admin: {
                description: 'Hero / page header section',
                condition: (data, _) => ['home', 'about', 'services'].includes(data.pageTemplate as string),
              },
              fields: [
                { name: 'heading', type: 'text', required: true, localized: true },
                { name: 'subheading', type: 'text', localized: true },
                { name: 'ctaLabel', type: 'text', localized: true, label: 'CTA Label' },
                { name: 'ctaHref', type: 'text', label: 'CTA Link' },
                { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
              ],
            },
            {
              name: 'featuresSection',
              type: 'group',
              admin: {
                description: 'Features / services grid section',
                condition: (data, _) => ['home', 'services'].includes(data.pageTemplate as string),
              },
              fields: [
                { name: 'heading', type: 'text', localized: true },
                {
                  name: 'features',
                  type: 'array',
                  minRows: 1,
                  maxRows: 12,
                  fields: [
                    { name: 'title', type: 'text', required: true, localized: true },
                    { name: 'description', type: 'textarea', localized: true },
                    { name: 'icon', type: 'text', admin: { description: 'Emoji or icon name' } },
                  ],
                },
              ],
            },
            {
              name: 'bodyContent',
              type: 'richText',
              localized: true,
              admin: {
                description: 'Main body content',
                condition: (data, _) => (data.pageTemplate as string) === 'about',
              },
            },
            {
              name: 'contactDetails',
              type: 'group',
              admin: {
                description: 'Contact information',
                condition: (data, _) => (data.pageTemplate as string) === 'contact',
              },
              fields: [
                { name: 'address', type: 'text', localized: true },
                { name: 'phone', type: 'text' },
                { name: 'email', type: 'text' },
                { name: 'hours', type: 'text', localized: true },
              ],
            },
            {
              name: 'ctaSection',
              type: 'group',
              admin: {
                description: 'Call to action section',
                condition: (data, _) => ['home', 'services', 'contact'].includes(data.pageTemplate as string),
              },
              fields: [
                { name: 'heading', type: 'text', localized: true },
                { name: 'body', type: 'textarea', localized: true },
                { name: 'primaryLabel', type: 'text', localized: true },
                { name: 'primaryHref', type: 'text' },
                { name: 'secondaryLabel', type: 'text', localized: true },
                { name: 'secondaryHref', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              admin: { description: 'URL slug, e.g. "about" → /en/about. Use "home" for the root page.' },
            },
            {
              name: 'pageTemplate',
              type: 'text',
              admin: {
                description: 'Template key mapping to a component in the tenant renderer (e.g. "home", "about", "portfolio-item").',
              },
              defaultValue: 'page',
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'meta',
              type: 'group',
              label: 'SEO',
              fields: [
                { name: 'title', type: 'text', localized: true },
                { name: 'description', type: 'textarea', localized: true },
                { name: 'ogImage', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [afterChangePage],
    afterDelete: [afterDeletePage],
  },
}
