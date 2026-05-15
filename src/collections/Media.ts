import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    hidden: true,
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  upload: {
    // Sizes for responsive images. Payload + Sharp generates these on upload.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 768, height: undefined, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const tenantVal = data.tenant
        if (!tenantVal) return data
        const tenantId =
          typeof tenantVal === 'string' ? tenantVal
          : typeof tenantVal === 'number' ? String(tenantVal)
          : String((tenantVal as { id: string | number }).id ?? '')
        if (!tenantId) return data
        try {
          const tenant = await req.payload.findByID({ collection: 'tenants', id: tenantId, depth: 0 })
          const slug = (tenant as unknown as { slug?: string })?.slug ?? 'media'
          return { ...data, prefix: slug, tenantSlug: slug }
        } catch {
          return data
        }
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: { description: 'Alt text for accessibility and SEO.' },
    },
    {
      name: 'folder',
      type: 'relationship',
      relationTo: 'media-folders',
      admin: { position: 'sidebar' },
    },
    {
      name: 'tenantSlug',
      type: 'text',
      admin: { hidden: true },
    },
  ],
}
