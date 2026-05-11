# Glossary

**Tenant** — A client website hosted on this platform. Identified by a slug (e.g. `acme`) and one or more domains (e.g. `acme.com`). Has its own config file, seed file, theme, and content in the DB.

**Locale** — A language/region code. Platform-wide: `de`, `en`, `vi`. Each tenant enables a subset. URLs use path prefixes: `/en/about`, `/de/about`.

**Block** — A self-contained content section in a page. Defined as a Payload `Block` (fields) + a React component (rendering). Examples: Hero, FeatureGrid, CTA, RichText.

**Layout** — A page-type-specific arrangement of blocks. Controls which blocks appear and in what order for a specific page type. Tenants select a layout per page type in their config.

**Page type** — A named category of page: `home`, `about`, `services`, `contact`, `blog`, `page`. Tenants enable the types they need. Each type can have multiple layout variants.

**Theme token** — A CSS variable derived from the tenant's config: `--color-primary`, `--font-sans`, etc. Injected on the tenant root div. Tailwind utilities reference these variables.

**Draft** — A Payload version of a page not yet published. Preview mode in Next.js allows editors to see drafts before publishing.

**Revalidation tag** — A string key attached to a cached Next.js RSC response. Format: `tenant:<slug>:<locale>:/<slug>`. Calling `revalidateTag(tag)` invalidates all responses with that tag.

**Registry** — `src/tenants/registry.ts`. The list of all tenant configs imported at build time. The middleware and server components read from this file. Updated by the seed script when adding a tenant.

**Dev preview route** — `/tenant/<domain>/<locale>/...` — a dev-only URL pattern that simulates a request from a specific tenant domain without DNS changes. Blocked in production.

**Seed script** — `pnpm tenant:seed <slug>`. Reads the tenant's `tenant.config.ts` and `seed.ts` files, then creates/updates the tenant document and placeholder content in the Payload DB.

**Multi-tenant plugin** — `@payloadcms/plugin-multi-tenant`. Adds a `tenant` relationship field to scoped collections and filters the Payload admin so editors only see their assigned tenant's content.
