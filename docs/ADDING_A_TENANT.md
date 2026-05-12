# Adding a Tenant

## Prerequisites

- Docker services running: `docker compose up -d`
- Dev server running or accessible: `pnpm dev`

---

## Step 1 — Create the tenant directory

```
src/tenants/<slug>/
├── tenant.config.ts    ← config (theme, locales, pages)
└── seed.ts             ← placeholder content
```

Replace `<slug>` with a lowercase alphanumeric identifier, e.g. `acme`.

## Step 2 — Write `tenant.config.ts`

Copy the fixture as a starting point:

```bash
cp -r src/tenants/__fixture__ src/tenants/acme
```

Edit `src/tenants/acme/tenant.config.ts`:

```ts
import type { TenantConfig } from '@/lib/tenant/types'

const config: TenantConfig = {
  slug: 'acme',
  name: 'Acme GmbH',
  domains: ['acme.com', 'www.acme.com'],
  locales: {
    enabled: ['de', 'en'],
    default: 'de',
    omitDefaultPrefix: false,
  },
  theme: {
    primaryColor: '#c00000',
  },
  enabledPages: ['home', 'about', 'contact'],
  layouts: {
    home: 'home-layout-1',
  },
}

export default config
```

See `docs/TENANT_CONFIG_SCHEMA.md` for all fields.

## Step 3 — Write `seed.ts`

```ts
import type { Payload } from 'payload'
import type { TenantConfig } from '@/lib/tenant/types'

export async function seed(payload: Payload, config: TenantConfig) {
  // 1. Upsert tenant document
  // 2. Create placeholder pages
  // See src/tenants/__fixture__/seed.ts for a complete example
}
```

## Step 4 — Register in the registry

Edit `src/tenants/registry.ts` and add an import:

```ts
import acmeConfig from './acme/tenant.config'

export const ALL_TENANT_CONFIGS: TenantConfig[] = [
  fixtureConfig,
  acmeConfig,   // ← add this line
]
```

## Step 5 — Run the seed script

```bash
pnpm tenant:seed acme
```

This creates the tenant document and placeholder pages in the DB.

## Step 6 — Preview in dev

```
http://localhost:3000/tenant/acme.com/de
http://localhost:3000/tenant/acme.com/en/about
```

## Step 7 — Edit content

1. Open `http://localhost:3000/admin`
2. Log in as super-admin
3. Navigate to Pages → filter by tenant "Acme"
4. Edit the placeholder content

## Step 8 — Point DNS (production)

1. Add an A record for `acme.com` pointing to the server IP.
2. Coolify provisions SSL automatically via Let's Encrypt.
3. Verify: `https://acme.com` → renders the German home page.

---

## Checklist

- [ ] `src/tenants/acme/tenant.config.ts` created
- [ ] `src/tenants/acme/seed.ts` created
- [ ] `src/tenants/registry.ts` updated
- [ ] `pnpm tenant:seed acme` ran successfully
- [ ] Dev preview works at `/tenant/acme.com/<locale>`
- [ ] Admin shows tenant in dropdown
- [ ] (Prod) DNS configured and SSL active

---

## Example: Acme (Phase 2 reference implementation)

`src/tenants/acme/` is the canonical Phase 2 example. Use it as a template for new tenants.

### Design choices and why

**Locales: `['en', 'de']`, NOT `'vi'`**
Proves the per-tenant locale gate: `GET /tenant/acme.com/vi/anything` returns 404. The platform stores content for all three locales in Payload; the frontend enforces the enabled subset.

**Enabled pages: `['home', 'about', 'services', 'contact']`, NOT `'blog'`**
Proves the page-type gate added in Phase 2: even if a `blog` page document existed in the DB for this tenant, the page component would call `notFound()` because `'blog' ∉ config.enabledPages`.

**Theme: blue-800 primary, amber-400 accent**
CSS vars injected by `TenantPageRenderer → buildThemeCssVars`. Tailwind utilities `bg-primary`, `text-accent`, `rounded-tenant` consume these vars. Each tenant has its own design — no shared layout components.

**Blocks used (all existing, no new blocks needed)**
- Home: Hero → FeatureGrid(3-col) → CTA
- About: Hero → RichText
- Services: Hero → FeatureGrid(2-col) → CTA
- Contact: RichText (address/phone/email) → CTA (mailto: link)

**Seed is idempotent**
Re-running `pnpm tenant:seed acme` updates existing records rather than duplicating them. The upsert pattern queries by `slug` + `tenant.value` before deciding create vs update.

**Media seeding**
Three Picsum images are fetched and uploaded to MinIO. If MinIO is not running, the seed logs a warning and continues — pages seed successfully without images.

### Acme tenant config (summary)

```ts
{
  slug: 'acme',
  name: 'Acme GmbH',
  domains: ['acme.com', 'www.acme.com'],
  locales: { enabled: ['en', 'de'], default: 'en', omitDefaultPrefix: false },
  theme: { primaryColor: '#1e40af', secondaryColor: '#1e3a8a', accentColor: '#f59e0b',
           fontFamily: 'Inter, sans-serif', borderRadius: '0.5rem' },
  enabledPages: ['home', 'about', 'services', 'contact'],
  navigation: [...],  // 4 items, en + de labels
}
```

### Running the full verification

```bash
docker compose up -d          # Postgres + MinIO
pnpm tenant:seed acme         # Seed DB + media
pnpm dev                      # Start Next.js + Payload

# Spot checks
open http://localhost:3000/tenant/acme.com/en          # blue theme, English
open http://localhost:3000/tenant/acme.com/de          # German
open http://localhost:3000/tenant/acme.com/vi          # must 404
open http://localhost:3000/tenant/acme.com/en/blog     # must 404

# Tests
pnpm test           # Vitest unit tests (includes acmeTenantConfig.test.ts)
pnpm test:e2e       # Playwright (requires running dev server + seeded DB)
```
