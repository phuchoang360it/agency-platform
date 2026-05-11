# Agent: Debug Middleware / Routing

## Goal
Diagnose tenant resolution and routing issues in this multi-tenant Next.js platform.

## Context
- Middleware: `src/middleware.ts` — runs on Edge, sets `x-tenant-domain` header
- Tenant resolution: `src/lib/tenant/resolveTenant.ts` — reads from registry
- Registry: `src/tenants/registry.ts` — static list of all tenant configs
- Dev preview: `/tenant/<domain>/<locale>/...` → middleware rewrites to `/<locale>/...`

## Common issues and where to look

### "no tenants configured" page shows unexpectedly
1. Check `src/tenants/registry.ts` — is the tenant imported and listed?
2. Check `tenant.config.ts` — does the `domains` array match the incoming host exactly?
3. In dev, use `/tenant/<domain>/...` URL format, not the real domain.

### 404 on tenant pages
1. Check locale — is it in the tenant's `locales.enabled` array?
2. Check if the page slug exists in the DB (run `pnpm tenant:seed <slug>` first).
3. Check the Payload admin — is the page published (not draft)?

### Revalidation not working
1. Check collection hooks in `src/collections/Pages.ts` — are they firing?
2. Check tag format: `buildTag(tenantSlug, locale, slug)` in `src/lib/revalidation/tags.ts`
3. `unstable_cache` tags in `src/app/(frontend)/[locale]/[[...slug]]/page.tsx` must match.

### Admin shows wrong tenant
1. Check user roles in Payload — is the user `super-admin` or `editor`?
2. Check the multi-tenant plugin config in `src/payload.config.ts`.

## Debugging steps
1. Add `console.log` in `src/middleware.ts` to see what `x-tenant-domain` is being set.
2. Check Next.js server logs for RSC errors.
3. Use `src/app/(frontend)/tenant/[domain]/...` dev-preview route to isolate routing from DNS.
4. Read `docs/ARCHITECTURE.md` for the full request flow diagram.
