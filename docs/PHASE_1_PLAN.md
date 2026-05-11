# Phase 1 Plan — Scaffold the Platform

## Decisions and interpretations

### 1. Two `(frontend)` route groups in SPEC §5
The SPEC shows two `(frontend)` route groups under `src/app/`. Next.js cannot have two sibling groups with the same name.
**Decision**: Single `(frontend)` group containing both `[locale]/[[...slug]]` and `tenant/[domain]/[locale]/[[...slug]]`.

### 2. Tenant resolution in Edge middleware
Middleware runs on the Next.js Edge runtime by default. Edge cannot use `fs` for dynamic directory scanning.
**Decision**: Static tenant registry at `src/tenants/registry.ts` that imports all tenant configs explicitly. The seed script updates this file when adding a tenant. `resolveTenant.ts` reads from the registry — works on Edge. The SPEC's "auto-discover by scanning" is achieved at the registry level (build-time pattern), not runtime.

### 3. Middleware scope
Middleware sets `x-tenant-domain` header from either the `/tenant/<domain>` path prefix (dev) or the `Host` header (prod). Full config loading (`TenantConfig` object) happens server-side in RSC page components, not in the middleware. This keeps the middleware small and Edge-compatible.

### 4. Root `/` path
`[locale]/[[...slug]]` requires at least a locale segment; it does not match `/`. A dedicated `src/app/page.tsx` handles `/`. If a tenant is resolved (via `x-tenant-domain` header), it redirects to `/${defaultLocale}/`. Otherwise it renders "no tenants configured."

### 5. Setup method
Manual scaffold (not `pnpm create payload-app`) for precise control over the directory layout matching SPEC §5.

### 6. Tailwind version
v3.x — SPEC shows `tailwind.config.ts` which is the v3 pattern. v4 uses CSS-first config.

### 7. ESLint
`.eslintrc.json` with `eslint-config-next` (ESLint 8 compatible). Avoids ESLint 9 flat-config complexity in Phase 1.

### 8. Payload admin layout
Root `src/app/layout.tsx` provides `<html>/<body>`. `(payload)/layout.tsx` passes through children. Tailwind globals only imported in `(frontend)/layout.tsx` to avoid styling conflicts with Payload admin CSS.

### 9. `@payload-config` alias
Resolved by `withPayload` wrapper in `next.config.ts` (standard Payload 3.x setup). Also added to `tsconfig.json` paths for IDE support.

### 10. Fixture tenant
Slug: `__fixture__`, domain: `__fixture__.test`, locales: `['en', 'de']`, default: `en`. Included in the registry so dev-preview route works immediately.

---

## File manifest (70 files)

### Configuration
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `vitest.config.ts`
- `playwright.config.ts`
- `.eslintrc.json`
- `.prettierrc`
- `.gitignore`
- `.env.example`

### Docker
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `Dockerfile`

### Core lib
- `src/lib/tenant/types.ts`
- `src/lib/tenant/loadTenantConfig.ts`
- `src/lib/tenant/resolveTenant.ts`
- `src/lib/i18n/locales.ts`
- `src/lib/i18n/resolveLocale.ts`
- `src/lib/seo/generateMetadata.ts`
- `src/lib/seo/jsonLd.ts`
- `src/lib/seo/hreflang.ts`
- `src/lib/revalidation/tags.ts`
- `src/lib/payload.ts`

### Collections
- `src/collections/Tenants.ts`
- `src/collections/Users.ts`
- `src/collections/Pages.ts`
- `src/collections/Media.ts`

### Blocks
- `src/blocks/Hero/index.ts`
- `src/blocks/Hero/Component.tsx`
- `src/blocks/FeatureGrid/index.ts`
- `src/blocks/FeatureGrid/Component.tsx`
- `src/blocks/CTA/index.ts`
- `src/blocks/CTA/Component.tsx`
- `src/blocks/RichText/index.ts`
- `src/blocks/RichText/Component.tsx`

### Payload + middleware
- `src/payload.config.ts`
- `src/payload-types.ts`
- `src/middleware.ts`

### Tenants
- `src/tenants/registry.ts`
- `src/tenants/__fixture__/tenant.config.ts`
- `src/tenants/__fixture__/seed.ts`

### App routes
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/(frontend)/layout.tsx`
- `src/app/(frontend)/[locale]/[[...slug]]/page.tsx`
- `src/app/(frontend)/tenant/[domain]/[locale]/[[...slug]]/page.tsx`
- `src/app/(payload)/layout.tsx`
- `src/app/(payload)/admin/[[...segments]]/page.tsx`
- `src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- `src/app/(payload)/api/[...slug]/route.ts`
- `src/app/api/revalidate/route.ts`
- `src/app/sitemap.xml/route.ts`
- `src/app/robots.txt/route.ts`
- `src/styles/globals.css`

### Components
- `src/components/ui/NoTenants.tsx`
- `src/components/layouts/HomeLayout1.tsx`
- `src/components/layouts/HomeLayout2.tsx`

### Scripts
- `scripts/tenant-seed.ts`
- `scripts/generate-types.ts`

### Tests
- `tests/unit/tenant/resolveTenant.test.ts`
- `tests/unit/tenant/loadTenantConfig.test.ts`
- `tests/unit/i18n/resolveLocale.test.ts`
- `tests/unit/revalidation/tags.test.ts`
- `tests/e2e/scaffold-smoke.spec.ts`

### Docs
- `CLAUDE.md`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/CONVENTIONS.md`
- `docs/TENANT_CONFIG_SCHEMA.md`
- `docs/GLOSSARY.md`
- `docs/ADDING_A_TENANT.md`
- `.claude/agents/add-block.md`
- `.claude/agents/add-tenant.md`
- `.claude/agents/debug-middleware.md`

---

## Acceptance criteria checklist
- [ ] `pnpm install && docker compose up -d && pnpm dev` works
- [ ] `localhost:3000/admin` shows Payload login
- [ ] `localhost:3000` shows "no tenants configured" page
- [ ] `localhost:3000/tenant/__fixture__.test/en` renders fixture tenant home
- [ ] `pnpm test` (Vitest) all green
- [ ] `pnpm test:e2e` smoke test green
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] All docs from SPEC §6 exist
