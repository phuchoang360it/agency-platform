# Conventions

## File naming

| Thing | Convention | Example |
|---|---|---|
| React component file | PascalCase | `HeroComponent.tsx` |
| Non-component TS | camelCase | `resolveTenant.ts` |
| Payload collection | PascalCase | `Pages.ts` |
| Payload block Payload config | `index.ts` inside block dir | `src/blocks/Hero/index.ts` |
| Payload block React component | `Component.tsx` inside block dir | `src/blocks/Hero/Component.tsx` |
| Tenant config | `tenant.config.ts` | `src/tenants/acme/tenant.config.ts` |
| Tenant seed | `seed.ts` | `src/tenants/acme/seed.ts` |

## Where things go

| Category | Location |
|---|---|
| Payload collections | `src/collections/` |
| Content blocks (Payload + React pair) | `src/blocks/<BlockName>/` |
| Page-level layout variants | `src/components/layouts/` |
| Shared UI primitives | `src/components/ui/` |
| Tenant lib (types, resolution) | `src/lib/tenant/` |
| i18n lib | `src/lib/i18n/` |
| SEO lib | `src/lib/seo/` |
| Revalidation lib | `src/lib/revalidation/` |
| Tenant config + seed files | `src/tenants/<slug>/` |
| App routes (frontend) | `src/app/(frontend)/` |
| Admin routes | `src/app/(payload)/` |
| API routes | `src/app/api/` |
| Unit tests | `tests/unit/` |
| E2E tests | `tests/e2e/` |

## When to add a block vs a layout vs a page type

**Block**: a self-contained content section (Hero, FeatureGrid, CTA, RichText). Can appear anywhere in the `layout` field of a Page. Add a block when a new content pattern emerges that doesn't map to an existing block.

**Layout**: a page-type-specific arrangement of blocks. Controls the order and selection of blocks for a page type. Add a layout when a page type needs a structurally different presentation (not just different content).

**Page type**: a named category of page (`home`, `about`, `services`, etc.). Tenant configs enable or disable page types. Add a page type when clients need a fundamentally different page category not covered by the generic `page` type.

## Block pattern

Every block is a pair of files:
1. `src/blocks/<Name>/index.ts` — Payload `Block` config (fields, slug).
2. `src/blocks/<Name>/Component.tsx` — React component that renders the block.

The component's props type comes from `payload-types.ts` (auto-generated). The block slug in Payload must match the `blockType` discriminant in the type union.

## Per-tenant design (not shared layout variants)

Each tenant has its own design. There are **no shared layout variant components** that multiple tenants choose between. A tenant's look is fully determined by:

1. **Theme tokens** in `tenant.config.ts` → injected as CSS vars → consumed by Tailwind utilities.
2. **Block selection and content** in `seed.ts` → e.g. FeatureGrid(3-col) vs FeatureGrid(2-col).

`TenantPageRenderer` renders blocks sequentially. If a tenant needs a structurally unique page structure (a real sidebar, a true split-panel), create a tenant-specific layout file in `src/tenants/<slug>/` and render it from that tenant's seed/config. Do **not** add shared layout components that all tenants select from.

## Page-type gating

The page component (`src/app/(frontend)/[locale]/[[...slug]]/page.tsx`) enforces `config.enabledPages` after fetching from the DB:

```ts
if (page.pageType && !config.enabledPages.includes(page.pageType as PageType)) {
  notFound()
}
```

This means adding a `blog` page in Payload for a tenant that has `blog` excluded from `enabledPages` will correctly 404 in the frontend. The same gate exists in the dev-preview route.

## Seed idempotency

All seed functions must be idempotent: query by `slug + tenant.value` before create. Use the upsert helper pattern shown in `src/tenants/acme/seed.ts`. Re-running `pnpm tenant:seed <slug>` must be safe at any time.

## Commit style

`<type>(<scope>): <what>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
Scopes: `tenant`, `blocks`, `middleware`, `i18n`, `seo`, `payload`, `deps`

Example: `feat(blocks): add Testimonials block`
