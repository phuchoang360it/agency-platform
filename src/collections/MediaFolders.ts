import type { CollectionConfig } from 'payload'

export const MediaFolders: CollectionConfig = {
  slug: 'media-folders',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'updatedAt'],
    components: {
      views: {
        list: {
          Component: 'components/payloadCMS/MediaFolderBrowser#MediaFolderBrowser',
        },
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'media-folders',
      admin: { description: 'Parent folder (leave empty for root)' },
    },
  ],
}
