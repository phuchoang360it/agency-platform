# Agent: Add Tenant

## Goal
Create a new tenant configuration and seed file, then register it in the platform registry.

## Context
- Tenant configs live at `src/tenants/<slug>/tenant.config.ts`
- Seed files live at `src/tenants/<slug>/seed.ts`
- Registry is at `src/tenants/registry.ts` — must be updated
- Schema reference: `docs/TENANT_CONFIG_SCHEMA.md`
- Full guide: `docs/ADDING_A_TENANT.md`

## Steps to follow
1. Read `src/tenants/acme/seed.ts` as the reference implementation (canonical pattern)
2. Create `src/tenants/<slug>/tenant.config.ts` with the client's details
3. Create `src/tenants/<slug>/seed.ts` — follow the acme seed pattern exactly:
   - `upsertTenant` → `upsertMediaFolder(payload, config.name)` → `seedMedia(..., folderId, ...)` → pages
   - The media folder must be the first DB write after the tenant row; name it `config.name`
4. Add the import and entry to `src/tenants/registry.ts`
5. Tell the user to run: `pnpm tenant:seed <slug>`
6. Tell the user to preview at: `localhost:3000/tenant/<domain>/<locale>`

## Inputs needed from user
- Tenant slug (lowercase, e.g. `acme`)
- Display name
- Primary domain(s)
- Enabled locales and default locale
- Brand colour(s) if known
- Which page types to enable

## Validation
- Slug must match `/^[a-z0-9_-]+$/`
- Default locale must be in enabled locales
- Domains must not duplicate existing tenants
