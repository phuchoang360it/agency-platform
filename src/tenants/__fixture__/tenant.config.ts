import type { TenantConfig } from '@/lib/tenant/types'

// Fixture tenant used for Phase 1 testing and dev-preview route smoke tests.
// Access via: http://localhost:3000/tenant/__fixture__.test/en
const config: TenantConfig = {
  slug: '__fixture__',
  name: 'Fixture Tenant (Testing)',
  domains: ['__fixture__.test'],
  locales: {
    enabled: ['en', 'de'],
    default: 'en',
    omitDefaultPrefix: false,
  },
  theme: {
    primaryColor: '#0066cc',
    secondaryColor: '#004499',
    accentColor: '#ff6600',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
  },
  enabledPages: ['home', 'about'],
  layouts: {
    home: 'home-layout-1',
  },
  navigation: [
    { label: { en: 'Home', de: 'Start' }, slug: '', pageType: 'home' },
    { label: { en: 'About', de: 'Über uns' }, slug: 'about', pageType: 'about' },
  ],
}

export default config
