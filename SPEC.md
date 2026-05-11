# Multi-Tenant Web Agency Platform — Specification (SPEC.md)

> **This is the canonical specification. All phase prompts (PHASE_1, PHASE_2, PHASE_3) reference this document. Do not re-explain anything from here in those prompts — read this first.**

---

## 1. What we are building

A **multi-tenant web agency platform** that hosts many client marketing websites from a single Next.js application. Each client gets a unique domain (e.g. `www.acme.com`, `www.demo.de`) that points to the same server IP. The application identifies the tenant by inspecting the incoming `Host` header and renders the correct site.

Clients **never** access the CMS. Only platform admins log in to manage content. A super-admin sees all tenants; editors are scoped to assigned tenants.

## 2. Stack (non-negotiable)

| Layer | Choice |
|---|---|
| Framework | **Next.js 15 (App Router)** |
| CMS | **Payload CMS 3.x**, mounted natively inside the same Next.js app (single repo, single process) |
| Database | **PostgreSQL** (via `@payloadcms/db-postgres`) |
| Media storage | **MinIO** (S3-compatible) via `@payloadcms/storage-s3`. DB stores metadata, MinIO stores files |
| Styling | **Tailwind CSS** + per-tenant theme tokens (CSS variables) |
| Multi-tenancy | **`@payloadcms/plugin-multi-tenant`** |
| Package manager | **pnpm** |
| Language | **TypeScript (strict)** |
| Testing | **Vitest** (unit) + **Playwright** (e2e) |
| Local dev | Next.js + Payload run **natively** via `pnpm dev`. Only Postgres and MinIO run in Docker Compose |
| Production hosting | Hetzner VPS + Coolify + Docker |

## 3. Architecture overview

### 3.1 Single Next.js app, multi-tenant at runtime

- One codebase. One deployed app. One Payload admin at `/admin`.
- Incoming requests are routed to the right tenant by `Host` header.
- Production: `acme.com` → middleware resolves tenant `acme` → renders pages for that tenant.
- Local dev: `localhost:3000/tenant/acme.com/de/about` → middleware treats path prefix `tenant/<domain>` as a tenant override.

### 3.2 Hybrid configuration model ("file-based + DB")

- **Per-tenant config files in repo** (`/tenants/<slug>/tenant.config.ts`): theme tokens, enabled locales, enabled page types, default locale, layout/template selection, navigation structure.
- **Content in Payload DB**: text, images, page bodies, SEO fields — anything an editor changes.
- **Seed schema**: each tenant config can declare an initial content schema (placeholder pages and blocks). When a tenant is registered, the platform imports that schema into the DB. The admin then edits the seeded content.

### 3.3 Rendering

- **SSG with on-demand revalidation.** Pages are statically generated at build time.
- Payload `afterChange` / `afterDelete` hooks call `revalidateTag(...)` / `revalidatePath(...)` with tenant- and locale-scoped tags so only the affected pages re-render.
- Draft preview mode for editors uses Next.js Draft Mode.

### 3.4 Internationalization (i18n)

- Supported locales platform-wide: **`de`, `en`, `vi`**.
- Each tenant declares its **enabled subset** (e.g. `['de', 'en']` or `['vi']` only).
- URL strategy: **path prefix** — `/de/about`, `/en/about`, `/vi/about`.
- Default locale per tenant is configurable. The default locale's URLs may optionally be served without a prefix (configurable per tenant, default = always prefix for SEO clarity).
- `hreflang` tags are emitted only for the tenant's enabled locales.

### 3.5 Per-tenant page features

The platform supports a **superset** of page/section types. Each tenant's config enables only what it needs.

Available section/page types (v1):
- `home` (hero, featured services, CTA)
- `about`
- `services` (list + detail)
- `contact` (info + form placeholder — full form handling deferred)
- `blog` (list + post) — optional
- Generic `page` with composable blocks

A tenant config can mix and match. Example:
```ts
// tenants/acme/tenant.config.ts
{
  enabledPages: ['home', 'about', 'services', 'contact'],
  // tenant demo.de might be ['home', 'services', 'blog']
}
```

### 3.6 Per-tenant design

- **Shared component library** (`/src/components/blocks`) — building blocks (Hero, FeatureGrid, CTA, etc.).
- **Tenant theme tokens** in `tenant.config.ts` → injected as CSS variables on the tenant's root.
- **Layout/template selection**: each page type has 2–3 layout variants. The tenant config picks which layout each enabled page uses.
- This means: same components, different compositions, different theme tokens → meaningfully different sites without forking code.

### 3.7 SEO

- Per-tenant `sitemap.xml` and `robots.txt` (generated dynamically based on tenant + enabled locales).
- Per-page metadata (title, description, OG image) editable in CMS.
- Canonical URLs per locale.
- `hreflang` tags for enabled locales.
- JSON-LD structured data (Organization, WebSite, BreadcrumbList) generated server-side.
- Lighthouse target: 95+ on Performance / SEO / Best Practices.

### 3.8 Admin & access control

- Single `/admin` panel.
- Roles:
  - **super-admin**: sees and edits all tenants.
  - **editor**: scoped to one or more tenants via the multi-tenant plugin's `tenants` array on the user.
- Editors land in the admin with a tenant selector showing only their assigned tenants.

### 3.9 Onboarding flow (new client)

1. Developer creates `/tenants/<slug>/tenant.config.ts` with theme, enabled locales, enabled pages, layout choices, and a placeholder content schema.
2. Developer adds domain(s) to the tenant config.
3. Developer runs a seed script: `pnpm tenant:seed <slug>` — imports the placeholder content into Payload DB.
4. Admin logs in, navigates to the tenant, edits real content.
5. Domain DNS is pointed to the server IP. Coolify provisions SSL.

## 4. Local development behavior

### 4.1 Services

`docker-compose.yml` (dev) provides only:
- `postgres` (port 5432, named volume)
- `minio` (ports 9000 + 9001, named volume)

Next.js + Payload run on the host via `pnpm dev`.

### 4.2 Tenant preview at `/tenant/<domain>/...`

A **dev-only middleware branch** detects paths starting with `/tenant/<domain>/`, strips that prefix, and treats the rest as if the request came in on that domain. Behind the scenes the middleware sets the resolved tenant context and rewrites internally.

- `localhost:3000/tenant/acme.com/en/about` → renders Acme's `/en/about` page.
- `localhost:3000/tenant/demo.de/de` → renders Demo's German home page.

This `/tenant/...` prefix is **dev-only** and is rejected in production via an env check (`NODE_ENV !== 'production'`).

### 4.3 Admin in dev

`http://localhost:3000/admin` — same in dev and prod.

## 5. Repository layout (target)

```
.
├── CLAUDE.md                          # Top-level instructions for Claude Code
├── README.md
├── docs/
│   ├── ARCHITECTURE.md                # How the system is wired
│   ├── CONVENTIONS.md                 # Code style, naming, file placement
│   ├── TENANT_CONFIG_SCHEMA.md        # Reference for tenant.config.ts
│   ├── GLOSSARY.md                    # tenant, locale, block, layout, etc.
│   └── ADDING_A_TENANT.md             # Step-by-step
├── docker-compose.yml                 # Dev: postgres + minio
├── docker-compose.prod.yml            # Prod: app + postgres + minio (Coolify-compatible)
├── Dockerfile                         # Prod build
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── playwright.config.ts
├── vitest.config.ts
├── .env.example
├── .env.local                         # gitignored
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   └── [locale]/
│   │   │       └── [[...slug]]/
│   │   │           └── page.tsx       # Catch-all tenant pages
│   │   ├── (frontend)/
│   │   │   └── tenant/                # DEV-ONLY preview branch
│   │   │       └── [domain]/
│   │   │           └── [locale]/
│   │   │               └── [[...slug]]/
│   │   │                   └── page.tsx
│   │   ├── (payload)/                 # Payload admin + API routes
│   │   │   └── admin/
│   │   ├── sitemap.xml/
│   │   │   └── route.ts
│   │   ├── robots.txt/
│   │   │   └── route.ts
│   │   └── api/
│   │       └── revalidate/
│   │           └── route.ts
│   ├── middleware.ts                  # Host → tenant resolution + dev /tenant prefix
│   ├── payload.config.ts
│   ├── payload-types.ts               # auto-generated
│   ├── collections/
│   │   ├── Tenants.ts
│   │   ├── Users.ts
│   │   ├── Pages.ts
│   │   ├── Media.ts
│   │   └── ...
│   ├── blocks/                        # Payload + React block pairs
│   │   ├── Hero/
│   │   ├── FeatureGrid/
│   │   ├── CTA/
│   │   └── ...
│   ├── components/
│   │   ├── layouts/                   # Layout variants
│   │   └── ui/                        # Primitives
│   ├── lib/
│   │   ├── tenant/
│   │   │   ├── resolveTenant.ts       # Host → tenant
│   │   │   ├── loadTenantConfig.ts
│   │   │   └── types.ts
│   │   ├── i18n/
│   │   │   ├── locales.ts
│   │   │   └── resolveLocale.ts
│   │   ├── seo/
│   │   │   ├── generateMetadata.ts
│   │   │   ├── jsonLd.ts
│   │   │   └── hreflang.ts
│   │   └── revalidation/
│   │       └── tags.ts                # buildTag(tenantSlug, locale, ...)
│   └── tenants/
│       └── acme/                      # See PHASE 2
│           ├── tenant.config.ts
│           └── seed.ts
├── scripts/
│   ├── tenant-seed.ts                 # pnpm tenant:seed <slug>
│   └── generate-types.ts
└── tests/
    ├── unit/
    │   ├── tenant/
    │   └── i18n/
    └── e2e/
        ├── multi-tenant-routing.spec.ts
        ├── locale-resolution.spec.ts
        └── admin-access-control.spec.ts
```

## 6. Documentation deliverables (required)

Every phase must keep these in sync:

- **`CLAUDE.md`** (root) — instructions for future Claude Code runs: how to add a block, how to add a tenant, how the middleware works, which commands to run for which task, gotchas. Token-efficient. Optimized for an AI assistant, not a human reader.
- **`docs/ARCHITECTURE.md`** — diagrams (ASCII or Mermaid) of request flow, tenant resolution, content flow, revalidation flow.
- **`docs/CONVENTIONS.md`** — file naming, component patterns, where new blocks/layouts/collections go.
- **`docs/TENANT_CONFIG_SCHEMA.md`** — every field of `tenant.config.ts` documented with examples.
- **`docs/GLOSSARY.md`** — tenant, locale, block, layout, page-type, theme token, draft, revalidation tag.
- **`docs/ADDING_A_TENANT.md`** — exact steps and commands.

Inline comments are required on:
- The middleware (host resolution, dev override, locale resolution).
- The revalidation tag builder.
- The Payload multi-tenant plugin configuration.
- Any non-obvious access-control function.

## 7. Testing requirements

**Vitest (unit):**
- Tenant resolution from `Host` header (prod) and `/tenant/<domain>/` prefix (dev).
- Locale resolution and fallback.
- Tenant config validation (Zod schema).
- Revalidation tag builder.

**Playwright (e2e):**
- Multi-tenant routing: same path on two tenants yields different content.
- Locale routing: enabled locales work; disabled locales 404.
- Admin access control: editor scoped to tenant A cannot read/write tenant B's content.
- Sitemap.xml: contains only the tenant's enabled locales and published pages.

## 8. Environment variables (`.env.example`)

```bash
# Database
DATABASE_URI=postgres://payload:payload@localhost:5432/payload

# Payload
PAYLOAD_SECRET=replace-me-with-a-long-random-string
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Next.js
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# MinIO (S3)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=media
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true

# Revalidation
REVALIDATE_SECRET=replace-me
```

## 9. Out of scope (v1)

- Contact form submissions storage + email delivery (placeholder UI only).
- Analytics integration.
- Automated tenant creation via UI (developer-led flow is intentional).
- E-commerce, booking, member areas.
- Self-service onboarding.

## 10. Definition of done (per phase)

- All tests pass: `pnpm test` and `pnpm test:e2e`.
- `pnpm build` succeeds with no TypeScript errors.
- `pnpm lint` passes.
- Documentation updated to reflect any changes.
- CLAUDE.md updated if new patterns were introduced.
