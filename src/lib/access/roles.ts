import type { Access, FieldAccess } from 'payload'

type UserWithRoles = { roles?: string; id?: number | string }

export const isSuperAdmin = (user: unknown): boolean =>
  (user as UserWithRoles)?.roles === 'super-admin'

export const isAdmin = (user: unknown): boolean =>
  (user as UserWithRoles)?.roles === 'admin'

export const isAdminOrAbove = (user: unknown): boolean =>
  isSuperAdmin(user) || isAdmin(user)

export const adminOrAboveAccess: Access = ({ req: { user } }) => isAdminOrAbove(user)

export const selfOrAdminOrAboveAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdminOrAbove(user)) return true
  return { id: { equals: user.id } }
}

export const superAdminFieldAccess: FieldAccess = ({ req: { user } }) => isSuperAdmin(user)
