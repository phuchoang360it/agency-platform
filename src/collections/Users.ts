import type { CollectionConfig, FieldAccess, Where } from 'payload'
import { isSuperAdmin, isAdminOrAbove, adminOrAboveAccess } from '@/lib/access/roles'

const adminOrAboveFieldAccess: FieldAccess = ({ req: { user } }) => isAdminOrAbove(user)

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'updatedAt'],
    hidden: ({ user }) => !isAdminOrAbove(user),
  },
  access: {
    read: ({ req: { user } }): boolean | Where => {
      if (!user) return false
      if (isAdminOrAbove(user)) return { roles: { not_equals: 'super-admin' } }
      return { id: { equals: user.id } }
    },
    create: adminOrAboveAccess,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrAbove(user)) return true
      return { id: { equals: user.id } }
    },
    delete: adminOrAboveAccess,
    unlock: adminOrAboveAccess,
  },
  hooks: {
    beforeChange: [
      // Enforce: only one Super Admin may exist
      async ({ data, req, operation }) => {
        const role = data?.roles as string | undefined
        if (role === 'super-admin' && operation === 'create') {
          const { totalDocs } = await req.payload.find({
            collection: 'users',
            where: { roles: { equals: 'super-admin' } },
            limit: 1,
            pagination: false,
            overrideAccess: true,
          })
          if (totalDocs > 0) {
            throw new Error('A Super Admin already exists. Only one Super Admin is permitted.')
          }
        }
        return data
      },
      // Enforce: Admins cannot assign Admin or Super Admin roles (privilege escalation)
      ({ data, req }) => {
        const actor = req.user as { roles?: string } | null
        if (!actor || isSuperAdmin(actor)) return data
        const assignedRole = (data?.roles as string | undefined) ?? ''
        if (assignedRole === 'super-admin' || assignedRole === 'admin') {
          throw new Error('Admins can only assign the Editor role.')
        }
        return data
      },
      // Enforce: Editors cannot modify their own tenant assignments
      ({ data, req }) => {
        const actor = req.user as { roles?: string } | null
        if (!actor || isAdminOrAbove(actor)) return data
        delete (data as Record<string, unknown>).tenants
        delete (data as Record<string, unknown>).accessAllTenants
        return data
      },
    ],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Super Admin + Admin see all tenants. Editor is scoped to assigned tenants.',
      },
    },
    {
      type: 'collapsible',
      label: 'Assigned Tenants',
      admin: {
        condition: (data) => data?.roles === 'editor',
      },
      fields: [
        {
          name: 'accessAllTenants',
          type: 'checkbox',
          defaultValue: false,
          label: 'Access to all tenants',
          access: {
            read: adminOrAboveFieldAccess,
            create: adminOrAboveFieldAccess,
            update: adminOrAboveFieldAccess,
          },
          admin: {
            description: 'When enabled, user can access all tenants without explicit assignment.',
          },
        },
        {
          name: 'tenants',
          type: 'array',
          label: 'Tenant List',
          access: {
            update: adminOrAboveFieldAccess,
          },
          admin: {
            description: 'Tenants this user can access. Ignored when "Access to all tenants" is enabled.',
            condition: (data) => !data?.accessAllTenants,
          },
          fields: [
            {
              name: 'tenant',
              type: 'relationship',
              relationTo: 'tenants',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
