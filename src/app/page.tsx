import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { resolveTenant } from '@/lib/tenant/resolveTenant'
import { NoTenantsPage } from '@/components/ui/NoTenants'

// Root `/` handler.
// - If a tenant is resolved (Host header set by middleware), redirect to default locale.
// - Otherwise, show the "no tenants configured" platform page.
export default async function RootPage() {
  const headersList = await headers()
  const tenantDomain = headersList.get('x-tenant-domain')

  if (tenantDomain) {
    const tenant = resolveTenant(tenantDomain)
    if (tenant) {
      redirect(`/${tenant.locales.default}`)
    }
  }

  return <NoTenantsPage />
}
