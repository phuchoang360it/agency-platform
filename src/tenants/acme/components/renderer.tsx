import type React from 'react'
import type { TenantConfig } from '@/lib/tenant/types'
import type { Page } from '@/payload-types'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { ServicesPage } from './pages/ServicesPage'
import { ContactPage } from './pages/ContactPage'
import { GenericPage } from './pages/GenericPage'

type PageProps = { page: Page; config: TenantConfig; locale: string }

const TEMPLATES: Record<string, React.ComponentType<PageProps>> = {
  home: HomePage,
  about: AboutPage,
  services: ServicesPage,
  contact: ContactPage,
  page: GenericPage,
}

export function renderAcmePage(page: Page, config: TenantConfig, locale: string) {
  const Component = TEMPLATES[page.pageTemplate ?? ''] ?? GenericPage
  const currentSlug = page.slug === 'home' ? '' : page.slug

  return (
    <>
      <Nav config={config} locale={locale} currentSlug={currentSlug} />
      <main className="flex-1">
        <Component page={page} config={config} locale={locale} />
      </main>
      <Footer config={config} locale={locale} />
    </>
  )
}
