# Adding a Tenant

Step-by-step for onboarding a new client website.

---

## 1. Create the tenant config

```
src/tenants/<slug>/tenant.config.ts
```

```ts
import type { TenantConfig } from '@/lib/tenant/types'

const config: TenantConfig = {
  slug: 'newclient',
  name: 'New Client GmbH',
  domains: ['newclient.com', 'www.newclient.com'],
  locales: {
    enabled: ['en', 'de'],
    default: 'en',
    omitDefaultPrefix: false,
  },
  theme: {
    primaryColor: '#...',
    accentColor: '#...',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.375rem',
  },
  enabledPages: ['landing', 'portfolio', 'contact'],
  navigation: [
    { label: { en: 'Home', de: 'Start' }, slug: '', pageTemplate: 'landing' },
    { label: { en: 'Work', de: 'Projekte' }, slug: 'portfolio', pageTemplate: 'portfolio' },
    { label: { en: 'Contact', de: 'Kontakt' }, slug: 'contact', pageTemplate: 'contact' },
  ],
}

export default config
```

`enabledPages` lists the `pageTemplate` values valid for this tenant. Any page whose template is not in this list returns 404.

---

## 2. Register in the tenant registry

`src/tenants/registry.ts`:

```ts
import newclientConfig from './newclient/tenant.config'

const rawConfigs: TenantConfig[] = [
  fixtureConfig,
  acmeConfig,
  newclientConfig,   // ← add here
]
```

The registry validates the config at startup. A schema error throws immediately.

---

## 3. Build the component tree

All tenant UI lives under `src/tenants/<slug>/components/`. No sharing with other tenants.

```
src/tenants/newclient/
  tenant.config.ts
  seed.ts
  components/
    Nav.tsx
    Footer.tsx
    pages/
      LandingPage.tsx
      PortfolioPage.tsx
      ContactPage.tsx
    renderer.tsx
```

### `renderer.tsx`

The renderer owns the full page layout: it renders Nav, dispatches to the correct page component, and renders Footer. Individual page components only render their own content sections.

```tsx
import type React from 'react'
import type { TenantConfig } from '@/lib/tenant/types'
import type { Page } from '@/payload-types'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { LandingPage } from './pages/LandingPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ContactPage } from './pages/ContactPage'

type PageProps = { page: Page; config: TenantConfig; locale: string }

const TEMPLATES: Record<string, React.ComponentType<PageProps>> = {
  landing:   LandingPage,
  portfolio: PortfolioPage,
  contact:   ContactPage,
}

export function renderNewclientPage(page: Page, config: TenantConfig, locale: string) {
  const Component = TEMPLATES[page.pageTemplate ?? ''] ?? LandingPage
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
```

### Page component pattern

Page components render only their own content sections. They receive `page`, `config`, and `locale` as props. All text and image data comes from the `page` prop (Payload CMS). The component controls all layout and styling.

```tsx
import type { TenantConfig } from '@/lib/tenant/types'
import type { Page } from '@/payload-types'

type Props = { page: Page; config: TenantConfig; locale: string }

export function LandingPage({ page, locale }: Props) {
  const hero = page.heroSection
  return (
    <>
      <section>
        <h1>{hero?.heading}</h1>
        <p>{hero?.subheading}</p>
      </section>
    </>
  )
}
```

---

## 4. Wire up TenantPageRenderer

`src/components/layouts/TenantPageRenderer.tsx` — add a case for the new tenant slug:

```tsx
import { renderNewclientPage } from '@/tenants/newclient/components/renderer'

function renderPage(page: Page, config: TenantConfig, locale: string) {
  switch (config.slug) {
    case 'acme':       return renderAcmePage(page, config, locale)
    case 'newclient':  return renderNewclientPage(page, config, locale)
    default:           return null
  }
}
```

---

## 5. Seed the database

```
src/tenants/<slug>/seed.ts
```

The seed script creates the tenant DB row and upserts all pages with their content. Run:

```bash
pnpm tenant:seed newclient
```

The seed is idempotent — safe to re-run. Existing docs are updated, not duplicated.

Use `pageTemplate: 'landing'` (string, not `as const`) in seed data.

---

## 6. Verify

1. `pnpm typecheck` — no errors
2. `pnpm lint` — no warnings
3. Visit `http://localhost:3000/tenant/newclient.com/en/` — tenant renders
4. Visit `/admin` — pages appear scoped to the new tenant
