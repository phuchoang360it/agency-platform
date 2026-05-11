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
