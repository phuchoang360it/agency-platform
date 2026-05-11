import { z } from 'zod'

// Platform-wide supported locales. Tenants enable a subset.
export const SUPPORTED_LOCALES = ['de', 'en', 'vi'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const SupportedLocaleSchema = z.enum(['de', 'en', 'vi'])

export const PageTypeSchema = z.enum(['home', 'about', 'services', 'contact', 'blog', 'page'])
export type PageType = z.infer<typeof PageTypeSchema>

export const ThemeTokensSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  borderRadius: z.string().optional(),
})
export type ThemeTokens = z.infer<typeof ThemeTokensSchema>

export const NavItemSchema = z.object({
  label: z.record(z.string(), z.string()),
  slug: z.string(),
  pageType: PageTypeSchema.optional(),
})
export type NavItem = z.infer<typeof NavItemSchema>

// Full tenant configuration schema. Every field is validated at registry load time.
export const TenantConfigSchema = z.object({
  // Short identifier used in file paths, DB, and URLs. Lowercase alphanum + hyphens.
  slug: z.string().regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric, hyphens, underscores'),
  // Human-readable display name.
  name: z.string().min(1),
  // All domains (without protocol) this tenant answers to. Must have at least one.
  domains: z.array(z.string().min(1)).min(1),
  locales: z.object({
    // Subset of SUPPORTED_LOCALES that this tenant uses.
    enabled: z.array(SupportedLocaleSchema).min(1),
    // Default locale for this tenant. Must be in `enabled`.
    default: SupportedLocaleSchema,
    // When true, the default locale is served at `/` without a prefix (e.g. `/about`).
    // Default false for SEO clarity.
    omitDefaultPrefix: z.boolean().default(false),
  }),
  theme: ThemeTokensSchema.optional(),
  // Which page types are active for this tenant.
  enabledPages: z.array(PageTypeSchema).min(1),
  // Maps page type → layout variant identifier (e.g. 'home-layout-1').
  layouts: z.record(z.string(), z.string()).optional(),
  navigation: z.array(NavItemSchema).optional(),
})
  .refine(
    (cfg) => cfg.locales.enabled.includes(cfg.locales.default),
    { message: 'locales.default must be included in locales.enabled', path: ['locales', 'default'] },
  )

export type TenantConfig = z.infer<typeof TenantConfigSchema>
