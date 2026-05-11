import type { CollectionConfig } from 'payload'

// Tenant documents mirror the file-based config: they are the DB-side record
// that the multi-tenant plugin uses to scope content. The authoritative config
// (theme, locales, layouts) lives in src/tenants/<slug>/tenant.config.ts.
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    description: 'One record per client site. Slug must match src/tenants/<slug>/ directory.',
    defaultColumns: ['name', 'slug', 'active'],
  },
  access: {
    // Only super-admins can create/delete tenants; editors have read access
    // for the tenant selector. Fine-grained access is enforced by the
    // multi-tenant plugin on content collections.
    read: () => true,
    create: ({ req: { user } }) => user?.roles?.includes('super-admin') ?? false,
    update: ({ req: { user } }) => user?.roles?.includes('super-admin') ?? false,
    delete: ({ req: { user } }) => user?.roles?.includes('super-admin') ?? false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Display Name',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: { description: 'Must match the directory name under src/tenants/' },
    },
    {
      name: 'domains',
      type: 'array',
      label: 'Domains',
      admin: { description: 'Domains that resolve to this tenant (without protocol).' },
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
    },
  ],
}
