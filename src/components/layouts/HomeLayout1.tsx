import type { Page } from '@/payload-types'
import type { TenantConfig } from '@/lib/tenant/types'
import { HeroComponent } from '@/blocks/Hero/Component'
import { FeatureGridComponent } from '@/blocks/FeatureGrid/Component'
import { CTAComponent } from '@/blocks/CTA/Component'

type Props = {
  page: Page
  config: TenantConfig
  locale: string
}

// Layout variant 1 for home pages: Hero → FeatureGrid → CTA
// Selected via tenant.config.ts: layouts: { home: 'home-layout-1' }
export function HomeLayout1({ page, config: _config, locale: _locale }: Props) {
  const blocks = page.layout ?? []
  return (
    <>
      {blocks.map((block, i) => {
        if (block.blockType === 'hero') return <HeroComponent key={i} {...block} />
        if (block.blockType === 'featureGrid') return <FeatureGridComponent key={i} {...block} />
        if (block.blockType === 'cta') return <CTAComponent key={i} {...block} />
        return null
      })}
    </>
  )
}
