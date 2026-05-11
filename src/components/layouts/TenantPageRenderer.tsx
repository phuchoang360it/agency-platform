import type React from 'react'
import type { TenantConfig } from '@/lib/tenant/types'
import type { Page, PageLayout } from '@/payload-types'
import { HeroComponent } from '@/blocks/Hero/Component'
import { FeatureGridComponent } from '@/blocks/FeatureGrid/Component'
import { CTAComponent } from '@/blocks/CTA/Component'
import { RichTextComponent } from '@/blocks/RichText/Component'
import { buildThemeCssVars } from '@/components/layouts/theme'

type Props = {
  config: TenantConfig
  page: Page
  locale: string
}

function renderBlock(block: PageLayout, index: number) {
  switch (block.blockType) {
    case 'hero':
      return <HeroComponent key={index} {...block} />
    case 'featureGrid':
      return <FeatureGridComponent key={index} {...block} />
    case 'cta':
      return <CTAComponent key={index} {...block} />
    case 'richText':
      return <RichTextComponent key={index} {...block} />
    default:
      return null
  }
}

// Applies tenant CSS variable tokens so Tailwind's `bg-primary` etc. use tenant colours.
export function TenantPageRenderer({ config, page, locale }: Props) {
  const cssVars = buildThemeCssVars(config.theme)

  return (
    <div style={cssVars as React.CSSProperties} data-tenant={config.slug} data-locale={locale}>
      {page.layout?.map((block, i) => renderBlock(block as PageLayout, i))}
    </div>
  )
}
