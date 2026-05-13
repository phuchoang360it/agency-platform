# Architecture

## Overview

Multi-tenant Next.js 16 + Payload CMS 3 platform. One codebase, many client websites. Each tenant is a fully isolated website with its own domain, design, component tree, and page structure. Tenant content (text + images) is edited in Payload CMS. Everything else — layout, HTML structure, visual design — is determined by code.

---

## Request flow

```
Browser → CDN/proxy (prod) or localhost (dev)
  ↓
middleware.ts  [Edge runtime]
  - passthrough: /admin, /api/, /_next/
  - dev: parse /tenant/<domain>/... prefix, strip it, set x-tenant-domain header
  - prod: forward Host header as x-tenant-domain
  ↓
app/(frontend)/[locale]/[[...slug]]/page.tsx  [Node.js runtime]
  1. resolveTenant(x-tenant-domain header)  →  TenantConfig | null
  2. isLocaleEnabled(config, locale)        →  404 if disabled
  3. getTenantIdBySlug(config.slug)         →  DB tenant row ID
  4. getPage(tenantId, slugStr, locale)     →  Page doc (ISR-cached)
  5. config.enabledPages gate               →  404 if pageTemplate not in list
  6. TenantPageRenderer(config, page, locale) →  tenant HTML
```

---

## Tenant registry

`src/tenants/registry.ts` is the single source of truth for all tenants. It:
- Imports each `tenant.config.ts`
- Validates every config against `TenantConfigSchema` (Zod) at module load
- Exports `ALL_TENANT_CONFIGS` used by middleware and page routes

This file is imported at Edge runtime — it must not import Node.js-only modules.

### Adding a tenant

See `docs/ADDING_A_TENANT.md`.

---

## Tenant config (`TenantConfig`)

Defined in `src/lib/tenant/types.ts`. Key fields:

| Field | Purpose |
|---|---|
| `slug` | Unique identifier, used in DB queries, file paths, URLs |
| `domains` | All domains (no protocol) that resolve to this tenant |
| `locales.enabled` | Subset of `['de', 'en', 'vi']` active for this tenant |
| `locales.default` | Default locale; optionally served without prefix |
| `theme` | CSS variable values injected at render time |
| `navigation` | Ordered nav items — label (localized), slug, pageTemplate |
| `enabledPages` | Page templates active for this tenant; others → 404 |

---

## Component isolation model

**No components are shared between tenants.**

All tenant UI lives inside `src/tenants/<slug>/components/`:

```
src/tenants/<slug>/
  tenant.config.ts
  seed.ts
  components/
    Nav.tsx
    Footer.tsx
    pages/
      <PageTemplate>.tsx   # one file per page template
    renderer.tsx           # owns full page layout: Nav + main + Footer + template dispatch
    (any other UI pieces)
```

`TenantPageRenderer` (`src/components/layouts/TenantPageRenderer.tsx`) injects CSS theme vars and dispatches to the correct renderer by `config.slug`. It must never cross tenant boundaries.

### Renderer responsibility

`renderer.tsx` is the entry point for a tenant's entire page. It:
1. Resolves `page.pageTemplate` → page component
2. Renders Nav, the resolved component inside `<main>`, and Footer

Individual page components (`pages/HomePage.tsx` etc.) render only their own sections — they do not include Nav or Footer.

### Why strict isolation

- Clients get completely custom HTML structure and design — no shared base classes
- Changing one tenant's components carries zero risk to others
- Each tenant's code can evolve independently

---

## Flexible page tree

Page structure is per-tenant, defined entirely in `tenant.config.ts`. The platform imposes no fixed page hierarchy.

`navigation` defines what URLs exist and what they're called. `enabledPages` lists the `pageTemplate` values that are allowed — any page with a template outside this list returns 404.

`pageTemplate` on each Page document is a free-text string. `renderer.tsx` maps it to the correct component:

```tsx
const TEMPLATES: Record<string, React.ComponentType<PageProps>> = {
  landing:          LandingPage,
  'portfolio-item': PortfolioItemPage,
  team:             TeamPage,
  faq:              FaqPage,
}

export function renderNewclientPage(page: Page, config: TenantConfig, locale: string) {
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
```

There is no platform-wide enum of page types. Template keys are strings the tenant developer chooses freely.

---

## Content model

Payload `pages` collection stores structured content groups. Editors only see and edit text fields and image uploads. Layout, styling, and component choice are never stored in the CMS.

Content groups (conditional fields, visible only when relevant):

| Group | Available on templates |
|---|---|
| `heroSection` | heading, subheading, ctaLabel, ctaHref, backgroundImage |
| `featuresSection` | heading, feature list (title, description, icon) |
| `bodyContent` | richText |
| `contactDetails` | address, phone, email, hours |
| `ctaSection` | heading, body, primary/secondary button |
| `meta` | SEO title, description, ogImage |

When a page template needs data that doesn't fit existing groups, add a new group to `Pages.ts` — do not store layout or component config in CMS.

---

## ISR caching + revalidation

- Pages cached via `unstable_cache` with tags `tenant:<slug>`, `tenant:<slug>:<locale>:<page-slug>`
- Payload `afterChange` + `afterDelete` hooks call `revalidateTag` on save
- Tag helpers: `src/lib/revalidation/tags.ts`
- Manual revalidation: `POST /api/revalidate` with `{ tag: "..." }` and `REVALIDATE_SECRET` header

---

## Dev preview

In development, tenant domains aren't bound to DNS. Access any tenant via:

```
http://localhost:3000/tenant/<domain>/<locale>/[slug]
```

Example: `http://localhost:3000/tenant/acme.com/en/about`

The `/tenant/...` prefix is stripped by middleware before reaching page routes. It is blocked in production.

---

## Payload CMS admin

`/admin` — standard Payload admin panel. Available in dev and prod.

After changing collection schemas run:
```bash
pnpm generate:types      # updates src/payload-types.ts
pnpm generate:importmap  # updates src/app/(payload)/admin/importMap.js
pnpm migrate:create      # scaffolds the SQL migration
pnpm migrate             # applies it
```
