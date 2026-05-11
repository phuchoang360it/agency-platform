# Tenant Config Schema

Every tenant has a file at `src/tenants/<slug>/tenant.config.ts` exporting a `TenantConfig` object.

## Full example with comments

```ts
import type { TenantConfig } from '@/lib/tenant/types'

const config: TenantConfig = {
  // ── Identity ────────────────────────────────────────────────────────────
  // Lowercase alphanumeric + hyphens/underscores. Must match directory name.
  // Used in DB, URLs, log messages, cache tags.
  slug: 'acme',

  // Human-readable name shown in the Payload admin.
  name: 'Acme GmbH',

  // All domains (without protocol) this tenant answers to.
  // At least one required. First domain is used in sitemap canonical URLs.
  // In dev, use the /tenant/<domain>/... URL instead of configuring DNS.
  domains: ['acme.com', 'www.acme.com'],

  // ── Localisation ────────────────────────────────────────────────────────
  locales: {
    // Subset of the platform-wide ['de', 'en', 'vi'].
    // Only these locales are publicly accessible for this tenant.
    enabled: ['de', 'en'],

    // Default locale. Must be in `enabled`.
    // Used when redirecting from `/` and as hreflang x-default.
    default: 'de',

    // When true, the default locale's pages are served without a prefix:
    //   false (default):  /de/about  → served at /de/about
    //   true:             /de/about  → also served at /about
    // Set false for SEO clarity; only set true if the client insists.
    omitDefaultPrefix: false,
  },

  // ── Design tokens ───────────────────────────────────────────────────────
  // Injected as CSS variables on the tenant's root div.
  // Tailwind utilities like bg-primary use these variables.
  theme: {
    primaryColor: '#0066cc',    // CSS var: --color-primary (as RGB triplet)
    secondaryColor: '#004499',  // CSS var: --color-secondary
    accentColor: '#ff6600',     // CSS var: --color-accent
    fontFamily: 'Inter, sans-serif',  // CSS var: --font-sans
    borderRadius: '0.5rem',     // CSS var: --border-radius
  },

  // ── Content ─────────────────────────────────────────────────────────────
  // Which page types this tenant uses. Only enabled pages appear in sitemaps
  // and are publicly accessible. The generic 'page' type is always available.
  enabledPages: ['home', 'about', 'services', 'contact'],

  // Map of page type → layout variant identifier.
  // Available variants are in src/components/layouts/.
  // If a page type is not listed here, TenantPageRenderer uses the default block order.
  layouts: {
    home: 'home-layout-1',   // Options: 'home-layout-1', 'home-layout-2'
  },

  // ── Navigation ──────────────────────────────────────────────────────────
  // Optional nav items. label is a locale → text map.
  navigation: [
    { label: { de: 'Start', en: 'Home' }, slug: '', pageType: 'home' },
    { label: { de: 'Über uns', en: 'About' }, slug: 'about', pageType: 'about' },
    { label: { de: 'Leistungen', en: 'Services' }, slug: 'services', pageType: 'services' },
    { label: { de: 'Kontakt', en: 'Contact' }, slug: 'contact', pageType: 'contact' },
  ],
}

export default config
```

## Field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | `string` | ✓ | Lowercase + hyphens/underscores. Directory name. |
| `name` | `string` | ✓ | Display name. |
| `domains` | `string[]` | ✓ | Host values (no protocol). Min 1. |
| `locales.enabled` | `SupportedLocale[]` | ✓ | Subset of `['de','en','vi']`. Min 1. |
| `locales.default` | `SupportedLocale` | ✓ | Must be in `enabled`. |
| `locales.omitDefaultPrefix` | `boolean` | — | Default `false`. |
| `theme.primaryColor` | `string` | — | Hex colour. |
| `theme.secondaryColor` | `string` | — | Hex colour. |
| `theme.accentColor` | `string` | — | Hex colour. |
| `theme.fontFamily` | `string` | — | CSS font stack. |
| `theme.borderRadius` | `string` | — | CSS value e.g. `0.5rem`. |
| `enabledPages` | `PageType[]` | ✓ | Min 1. Values: `home`, `about`, `services`, `contact`, `blog`, `page`. |
| `layouts` | `Record<string,string>` | — | Page type → layout variant ID. |
| `navigation` | `NavItem[]` | — | Site navigation structure. |

## SupportedLocale values

`de` | `en` | `vi`

## PageType values

`home` | `about` | `services` | `contact` | `blog` | `page`
