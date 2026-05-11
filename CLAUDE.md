# CLAUDE.md

AI agent instructions for this repository. Read this before modifying any routing, tenant, or middleware code.

## What this repo is

A multi-tenant web agency platform. One Next.js 15 + Payload CMS 3 app serves many client websites. Tenant is identified at runtime by `Host` header (prod) or `/tenant/<domain>/` URL prefix (dev). Each client has a config file in `src/tenants/<slug>/tenant.config.ts`.

## Stack at a glance

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, RSC |
| CMS | Payload 3.x, mounted at `/admin` |
| DB | PostgreSQL via `@payloadcms/db-postgres` |
| Media | MinIO (S3) via `@payloadcms/storage-s3` |
| Multi-tenancy | `@payloadcms/plugin-multi-tenant` |
| Styling | Tailwind CSS v3 + CSS variable theme tokens |
| Language | TypeScript strict |
| Testing | Vitest (unit) + Playwright (e2e) |
| Package manager | pnpm |

## Where things live

```
src/
  app/
    (frontend)/[locale]/[[...slug]]/page.tsx   ← main tenant page
    (frontend)/tenant/[domain]/...             ← dev-only preview
    (payload)/admin/[[...segments]]/           ← Payload admin
    (payload)/api/[...slug]/                   ← Payload API
    api/revalidate/route.ts                    ← revalidation webhook
    sitemap.xml/route.ts                       ← per-tenant sitemap
    robots.txt/route.ts                        ← per-tenant robots
  collections/   ← Payload collection configs
  blocks/        ← Block pairs (Payload config + React component)
  components/layouts/  ← Page layout variants
  lib/
    tenant/     ← types, loadTenantConfig, resolveTenant
    i18n/       ← locales, resolveLocale
    seo/        ← generateMetadata, jsonLd, hreflang
    revalidation/ ← buildTag, buildRevalidationTags
  middleware.ts  ← Host → tenant routing (READ THIS FIRST)
  payload.config.ts
  tenants/
    registry.ts             ← list of all tenants (update when adding one)
    __fixture__/            ← test fixture tenant
    <slug>/tenant.config.ts ← per-tenant config
    <slug>/seed.ts          ← per-tenant placeholder content
```

## Common tasks (commands)

```bash
pnpm dev                     # Start dev server
pnpm build                   # Production build
pnpm test                    # Vitest unit tests
pnpm test:e2e                # Playwright tests
pnpm typecheck               # tsc --noEmit
pnpm lint                    # ESLint
pnpm generate:types          # Regenerate src/payload-types.ts
pnpm tenant:seed <slug>      # Seed a tenant into the DB
docker compose up -d         # Start Postgres + MinIO
```

## How tenants work (3 paragraphs)

Each tenant has a config file at `src/tenants/<slug>/tenant.config.ts` (theme, locales, pages, layouts) and a seed file at `src/tenants/<slug>/seed.ts` (placeholder content). All tenant configs are imported into `src/tenants/registry.ts` at build time. The registry builds a `Map<domain, TenantConfig>` that is used throughout the app, including in Edge middleware.

The middleware (`src/middleware.ts`) handles routing. In dev, it detects the `/tenant/<domain>/...` URL prefix, extracts the domain, strips the prefix, and rewrites the request to the normal `[locale]/[[...slug]]` route. In production, it reads the `Host` header. In both cases it sets an `x-tenant-domain` header on the request. Middleware is intentionally thin (Edge-compatible, no DB calls). Full config loading happens server-side in RSC page components via `resolveTenant(domain)` and `loadTenantConfig(slug)`.

Content is stored in Payload/PostgreSQL scoped to a tenant document via `@payloadcms/plugin-multi-tenant`. Pages are SSG with on-demand revalidation: Payload collection hooks call `revalidateTag(tag)` using tags from `buildTag(tenantSlug, locale, slug)`. A tenant purge hits `tenant:<slug>`, a locale purge hits `tenant:<slug>:<locale>`, and a single-page purge hits `tenant:<slug>:<locale>:/<slug>`.

## How to add a block

1. Create `src/blocks/<Name>/index.ts` — Payload `Block` config with `slug`, `fields`.
2. Create `src/blocks/<Name>/Component.tsx` — React component typed from `payload-types.ts`.
3. Add the block to `src/collections/Pages.ts` `layout.blocks` array.
4. Add a `case '<slug>':` in `src/components/layouts/TenantPageRenderer.tsx`.
5. Run `pnpm generate:types` to update `src/payload-types.ts`.
6. Test in the Payload admin: create a page, add the new block, save.

See `docs/CONVENTIONS.md` for the block pattern.

## How to add a tenant

See `docs/ADDING_A_TENANT.md` for exact steps. Short version:
1. `cp -r src/tenants/__fixture__ src/tenants/<slug>`
2. Edit `tenant.config.ts` and `seed.ts`
3. Add import to `src/tenants/registry.ts`
4. `pnpm tenant:seed <slug>`
5. Preview at `localhost:3000/tenant/<domain>/<locale>`

## Middleware: read this before changing routing

`src/middleware.ts` is the most critical file. It runs on Edge (no fs, no Node.js APIs). Key rules:
- `/admin` and `/api/*` are pass-throughs — do not add tenant logic for these.
- In dev, `/tenant/<domain>/...` is parsed and rewritten; the `x-tenant-domain` header is set.
- In prod, `Host` header is forwarded as `x-tenant-domain`. No DB calls here.
- Returning `NextResponse.next()` for unknown hosts is intentional — the page component calls `notFound()`.
- Do NOT import Node.js modules here (no `fs`, no dynamic `import(path)`).

## Gotchas

- `src/payload-types.ts` is gitignored and auto-generated. Run `pnpm generate:types` after schema changes. Phase 1 has a hand-written stub.
- The `@payload-config` import alias is resolved by `withPayload` in `next.config.ts`. It points to `src/payload.config.ts`.
- Tailwind globals are imported only in `src/app/(frontend)/layout.tsx`, NOT in root layout, to avoid styling the Payload admin.
- The `multiTenantPlugin` config in `payload.config.ts` may need adjustment if the `@payloadcms/plugin-multi-tenant` API differs from the scaffold — check the package changelog.
- `unstable_cache` is used for page data caching. Tags must exactly match what `buildTag()` returns; a mismatch means pages never revalidate.
- MinIO uses path-style URLs (`S3_FORCE_PATH_STYLE=true`). The S3 client must have `forcePathStyle: true`.
- Two `(frontend)` route groups in SPEC §5 is a typo — there is ONE `(frontend)` group containing both `[locale]/[[...slug]]` and `tenant/[domain]/...`.

## Recommended Claude Code setup

### Useful slash commands to create

Add these to your Claude Code slash commands:

- `/add-tenant` — guided workflow to create a new tenant config + seed file
- `/add-block` — create a new Payload block + React component pair
- `/regen-types` — run `pnpm generate:types` and summarise changes

### Suggested MCP servers

- **Postgres MCP** (`@modelcontextprotocol/server-postgres`) — inspect DB, debug tenant/page queries
- **Filesystem MCP** — file tree exploration
- **GitHub MCP** — PR review, issue tracking

### Subagent prompts

See `.claude/agents/` for reusable subagent prompts:
- `add-block.md` — create a new block end-to-end
- `add-tenant.md` — create a new tenant config + seed
- `debug-middleware.md` — diagnose routing and tenant resolution issues
