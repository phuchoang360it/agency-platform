# Conventions

## File structure

```
src/
  tenants/
    registry.ts              # imports + validates all tenant configs (Edge-safe)
    <slug>/
      tenant.config.ts       # TenantConfig — domains, locales, theme, nav
      seed.ts                # idempotent DB seed
      components/
        Nav.tsx
        Footer.tsx
        pages/
          <Template>.tsx     # one file per page template
        renderer.tsx         # full page layout: Nav + dispatch + Footer
  components/
    layouts/
      TenantPageRenderer.tsx # dispatches to per-tenant renderer by config.slug
      theme.ts               # buildThemeCssVars helper
    ui/                      # platform-level UI only (e.g. NoTenants fallback)
  lib/
    tenant/                  # tenant config loading + resolution utilities
    revalidation/            # ISR tag helpers
    seo/                     # metadata builders
    i18n/                    # locale helpers
  collections/               # Payload collection definitions
  app/
    (frontend)/              # public-facing Next.js routes
    (payload)/               # Payload admin routes
```

---

## Component isolation rules

- **All tenant UI under `src/tenants/<slug>/components/`** — never under `src/components/`
- **No cross-tenant imports**: `tenants/acme/` must never import from `tenants/otherclient/`
- **No shared page components**: there is no shared `sections/` or similar directory
- **Nav/Footer belong in `renderer.tsx`**: page components render content sections only
- **`src/components/layouts/` is platform plumbing only**: `TenantPageRenderer` and theme helpers live there, no tenant-specific UI

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| Tenant slug | lowercase alphanum + hyphens | `acme`, `new-client` |
| Page template key | lowercase kebab | `landing`, `portfolio-item` |
| Renderer export | `render<Slug>Page` | `renderAcmePage` |
| Component files | PascalCase | `HeroSection.tsx` |
| Utility files | camelCase | `buildThemeCssVars.ts` |
| Collection slugs | kebab plural | `pages`, `tenants`, `media` |

---

## Payload Pages collection

- `slug` — URL path segment. `home` maps to `/`. Use lowercase kebab only.
- `pageTemplate` — free-text string matching a key in the tenant's `TEMPLATES` map. Not an enum.
- Add new content fields as structured groups (not blocks). Editors see data fields only.
- Never store layout config, component names, CSS classes, or positioning in CMS fields.

After changing the Pages collection schema:
```bash
pnpm migrate:create   # scaffold the SQL migration
pnpm migrate          # apply it
pnpm generate:types   # regenerate src/payload-types.ts
```

---

## Localization

- Platform locales: `de`, `en`, `vi`
- Each tenant enables a subset via `locales.enabled`
- Locale-specific text fields have `localized: true` in the collection definition
- Slugs and non-display fields are NOT localized

---

## Tenant config

- `theme` values are CSS custom property values injected as inline style vars. Use hex colors, valid font stacks, and valid border-radius values.
- `navigation` items must have a `slug` matching a seeded page's slug for the link to resolve.
- `enabledPages` must list every `pageTemplate` value you intend to use — others return 404.
- `pageTemplate` in `navigation` items is optional metadata — it doesn't affect routing, only provides context.

---

## Seed scripts

- Always use `upsertTenant` + `upsertPage` patterns (find-then-create-or-update)
- Seeds must be safe to re-run — no hard failures, no duplicate docs
- Use `pageTemplate: 'home'` (plain string, not `as const`) in seed data
- Media is seeded via URL fetch. If MinIO/S3 is unavailable, `seedMedia` logs a warning and skips

---

## ISR tags

Format: `tenant:<slug>`, `tenant:<slug>:<locale>`, `tenant:<slug>:<locale>:<page-slug>`

Use `buildTag` and `buildRevalidationTags` from `src/lib/revalidation/tags.ts`. Never hardcode tag strings.

---

## PayloadCMS custom components

All custom Payload admin UI components live in `src/components/payloadCMS/`. This directory is **platform-level only** — no tenant-specific logic.

| Convention | Rule |
|---|---|
| Location | `src/components/payloadCMS/<ComponentName>.tsx` |
| Naming | PascalCase; suffix describes the Payload concept: `*Field`, `*View`, `*Modal`, `*Browser` |
| Registration | In `payload.config.ts` via Payload's `admin.components` API |
| Isolation | No tenant-specific imports; no cross-tenant logic |

Before building any new Payload admin UI, check `src/components/payloadCMS/` — it may already exist.

---

## Access control

Always import from `src/lib/access/roles.ts`. Never compare `user.roles` as a string inline.

**Collection-level pattern:**
```ts
import { adminOrAboveAccess } from '@/lib/access/roles'

access: {
  read: adminOrAboveAccess,
  create: adminOrAboveAccess,
  update: adminOrAboveAccess,
  delete: adminOrAboveAccess,
}
```

**Field-level pattern:**
```ts
import type { FieldAccess } from 'payload'
import { isAdminOrAbove } from '@/lib/access/roles'

const adminField: FieldAccess = ({ req: { user } }) => isAdminOrAbove(user)
```

**Editor tenant scope:** Editors are scoped to `user.tenants[].tenant` (relationship array). When querying on behalf of an editor, filter by their assigned tenant IDs. `accessAllTenants: true` bypasses this filter.
