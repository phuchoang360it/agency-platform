import type { CollectionConfig } from 'payload'
import { HeroBlock } from '@/blocks/Hero'
import { FeatureGridBlock } from '@/blocks/FeatureGrid'
import { CTABlock } from '@/blocks/CTA'
import { RichTextBlock } from '@/blocks/RichText'
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
    for (const tag of tags) {
      revalidateTag(tag)
    }
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
    for (const tag of tags) {
      revalidateTag(tag)
    }
  } catch {
    // next/cache unavailable outside Next.js runtime
  }
  return doc
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'pageType', 'updatedAt'],
    description: 'Content pages scoped to a tenant. One page per locale variant is stored.',
  },
  versions: {
    drafts: {
      autosave: { interval: 375 },
    },
  },
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
      name: 'pageType',
      type: 'select',
      options: [
        { label: 'Home', value: 'home' },
        { label: 'About', value: 'about' },
        { label: 'Services', value: 'services' },
        { label: 'Contact', value: 'contact' },
        { label: 'Blog List', value: 'blog' },
        { label: 'Generic Page', value: 'page' },
      ],
      defaultValue: 'page',
    },
    {
      name: 'layout',
      type: 'blocks',
      localized: true,
      blocks: [HeroBlock, FeatureGridBlock, CTABlock, RichTextBlock],
      admin: { description: 'Page content built from blocks.' },
    },
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
  hooks: {
    afterChange: [afterChangePage],
    afterDelete: [afterDeletePage],
  },
}
