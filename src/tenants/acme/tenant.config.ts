import type { TenantConfig } from '@/lib/tenant/types'

// Acme GmbH — blue/slate professional palette.
// Proves: per-tenant locale gate (vi disabled), per-tenant page gate (blog disabled).
const config: TenantConfig = {
  slug: 'acme',
  name: 'Acme GmbH',

  // Both the apex and www variant resolve to this tenant.
  domains: ['acme.com', 'www.acme.com'],

  locales: {
    // Intentionally excludes 'vi' — proves the locale gate returns 404 for /vi/...
    enabled: ['en', 'de'],
    default: 'en',
    omitDefaultPrefix: false,
  },

  theme: {
    // Blue-800 primary, Blue-900 secondary, Amber-400 accent.
    // Injected as CSS vars via TenantPageRenderer → buildThemeCssVars.
    primaryColor: '#1e40af',
    secondaryColor: '#1e3a8a',
    accentColor: '#f59e0b',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
    // Note: brief also requests --color-primary-foreground (#ffffff), --font-heading,
    // --font-body separately. ThemeTokensSchema doesn't have those fields yet.
    // Proposed Phase 3 schema extension: primaryForegroundColor, headingFontFamily.
  },

  // Intentionally excludes 'blog' — proves the page-type gate returns 404 for /en/blog.
  enabledPages: ['home', 'about', 'services', 'contact'],

  navigation: [
    { label: { en: 'Home', de: 'Start' }, slug: '', pageType: 'home' },
    { label: { en: 'About', de: 'Über uns' }, slug: 'about', pageType: 'about' },
    { label: { en: 'Services', de: 'Leistungen' }, slug: 'services', pageType: 'services' },
    { label: { en: 'Contact', de: 'Kontakt' }, slug: 'contact', pageType: 'contact' },
  ],
}

export default config
