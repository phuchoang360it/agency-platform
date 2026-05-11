import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Super-admin sees all tenants. Editor is scoped to assigned tenants.',
      },
    },
    // The multi-tenant plugin adds a `tenants` field automatically for editor scoping.
    // If manual tenant assignment is needed outside the plugin, add it here.
  ],
}
