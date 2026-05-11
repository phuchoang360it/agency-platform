import type { Page } from '@/payload-types'
import type { TenantConfig } from '@/lib/tenant/types'
import { HeroComponent } from '@/blocks/Hero/Component'
import { CTAComponent } from '@/blocks/CTA/Component'

type Props = {
  page: Page
  config: TenantConfig
  locale: string
}

// Layout variant 2 for home pages: minimal — Hero only with optional CTA at bottom.
// Selected via tenant.config.ts: layouts: { home: 'home-layout-2' }
export function HomeLayout2({ page, config: _config, locale: _locale }: Props) {
  const hero = page.layout?.find((b) => b.blockType === 'hero')
  const cta = page.layout?.find((b) => b.blockType === 'cta')
  return (
    <>
      {hero && hero.blockType === 'hero' && <HeroComponent {...hero} />}
      {cta && cta.blockType === 'cta' && (
        <CTAComponent {...cta} className="mt-auto" />
      )}
    </>
  )
}
