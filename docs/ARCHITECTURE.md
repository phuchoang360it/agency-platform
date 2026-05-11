# Architecture

## Request flow (production)

```mermaid
sequenceDiagram
    participant Client
    participant Edge as Middleware (Edge)
    participant RSC as Next.js RSC (Node)
    participant Payload
    participant DB as Postgres
    participant Cache as Next.js Cache

    Client->>Edge: GET acme.com/en/about
    Edge->>Edge: Read Host header → set x-tenant-domain: acme.com
    Edge->>RSC: Pass through (NextResponse.next())
    RSC->>RSC: headers().get('x-tenant-domain') → 'acme.com'
    RSC->>RSC: resolveTenant('acme.com') → TenantConfig
    RSC->>Cache: Check revalidation tag: tenant:acme:en:/about
    alt Cache hit
        Cache->>Client: Cached HTML
    else Cache miss
        RSC->>Payload: find({ collection:'pages', slug:'about', tenant:... })
        Payload->>DB: SELECT * FROM pages WHERE ...
        DB->>Payload: Page row
        Payload->>RSC: Page doc
        RSC->>RSC: Render TenantPageRenderer with blocks
        RSC->>Cache: Store with tag tenant:acme:en:/about
        RSC->>Client: HTML
    end
```

## Request flow (dev preview)

```
GET localhost:3000/tenant/__fixture__.test/en/about
    ↓ Middleware (Edge)
      - Detects /tenant/ prefix
      - Extracts domain: __fixture__.test
      - Rewrites URL to: /en/about
      - Sets header: x-tenant-domain: __fixture__.test
    ↓ RSC page.tsx (same as production from here)
      - resolveTenant('__fixture__.test') → fixture TenantConfig
      - Queries Payload for the page
      - Renders
```

## Tenant resolution

```
Host header (or /tenant/<domain> path)
    ↓
src/tenants/registry.ts
  - Static import of all TenantConfig files
  - Builds Map<domain, TenantConfig> at module load
    ↓
resolveTenant(host: string): TenantConfig | null
  - Normalises: lowercase, strip www., strip port
  - Lookup in Map
    ↓
TenantConfig | null
  - null → notFound() or NoTenantsPage
  - TenantConfig → render with tenant context
```

## Content flow (CMS → DB → SSG → revalidation)

```
Admin edits page in Payload
    ↓
Payload saves to PostgreSQL
    ↓
Collection afterChange hook fires
    ↓
buildRevalidationTags(tenantSlug, locales, [slug])
    ↓
revalidateTag('tenant:acme:en:/about')
    ↓
Next.js invalidates cached RSC response
    ↓
Next request for /en/about → cache miss → re-render from DB
    ↓
New HTML cached with same tags
```

## Multi-tenant data model

```
tenants            users               pages
---------          -----               -----
id                 id                  id
name               email               title (localized)
slug               roles[]             slug
domains[]          (tenant scoping     layout[] (blocks, localized)
active             via plugin)         meta (localized)
                                       tenant → tenants
                                       _status (draft|published)
```

## Revalidation tags hierarchy

```
tenant:acme                      ← flush all acme pages
  tenant:acme:en                 ← flush all English pages
    tenant:acme:en:/about        ← flush one page
  tenant:acme:de
    tenant:acme:de:/about
```
