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

## Commit style

`<type>(<scope>): <what>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
Scopes: `tenant`, `blocks`, `middleware`, `i18n`, `seo`, `payload`, `deps`

Example: `feat(blocks): add Testimonials block`
