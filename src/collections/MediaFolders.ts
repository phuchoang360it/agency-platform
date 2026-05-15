import type { CollectionConfig } from 'payload'

export const MediaFolders: CollectionConfig = {
  slug: 'media-folders',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'name', 'parent', 'updatedAt'],
    components: {
      views: {
        list: {
          Component: 'components/payloadCMS/MediaFolderBrowser#MediaFolderBrowser',
        },
      },
    },
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
        if (!data.parent) return { ...data, displayName: data.name ?? '' }
        const parentId =
          typeof data.parent === 'string' ? data.parent
          : typeof data.parent === 'number' ? String(data.parent)
          : String((data.parent as { id: string | number }).id ?? '')
        try {
          const parentFolder = await req.payload.findByID({
            collection: 'media-folders', id: parentId, depth: 0,
          }) as unknown as { displayName?: string; name?: string }
          const prefix = parentFolder?.displayName ?? parentFolder?.name ?? ''
          return { ...data, displayName: prefix ? `${prefix} / ${data.name ?? ''}` : (data.name ?? '') }
        } catch {
          return data
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'displayName',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'media-folders',
      admin: { description: 'Parent folder (leave empty for root)' },
    },
  ],
}
