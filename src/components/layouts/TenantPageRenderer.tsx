import type { TenantConfig } from '@/lib/tenant/types'
import type { Page } from '@/payload-types'
import { buildThemeCssVars } from '@/components/layouts/theme'
import { renderAcmePage } from '@/tenants/acme/components/renderer'
import { renderFixturePage } from '@/tenants/__fixture__/components/renderer'

type Props = {
  config: TenantConfig
  page: Page
  locale: string
}

function renderPage(page: Page, config: TenantConfig, locale: string) {
  switch (config.slug) {
    case 'acme':       return renderAcmePage(page, config, locale)
    case '__fixture__': return renderFixturePage(page, config, locale)
    default:           return null
  }
}

export function TenantPageRenderer({ config, page, locale }: Props) {
  const cssVars = buildThemeCssVars(config.theme)

  return (
    <div
      style={cssVars as React.CSSProperties}
      data-tenant={config.slug}
      data-locale={locale}
      className="min-h-screen flex flex-col font-sans"
    >
      {renderPage(page, config, locale)}
    </div>
  )
}
