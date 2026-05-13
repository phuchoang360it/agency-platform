# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## vexp — Context-Aware AI Coding <!-- vexp v2.0.12 -->

### MANDATORY: use vexp pipeline — do NOT grep or glob the codebase
For every task — bug fixes, features, refactors, debugging:
**call `run_pipeline` FIRST**. It executes context search + impact analysis +
memory recall in a single call, returning compressed results.

Do NOT use grep, glob, Bash, or cat to search/explore the codebase.
vexp returns pre-indexed, graph-ranked context that is more relevant and
uses fewer tokens than manual searching. Prefer `get_skeleton` over Read to
inspect files (detail: minimal/standard/detailed, 70-90% token savings).
Only use Read when you need exact raw content to edit a specific line.

### Primary Tool
- `run_pipeline` — **USE THIS FOR EVERYTHING**. Single call that runs
  capsule + impact + memory server-side. Returns compressed results.
  Auto-detects intent (debug/modify/refactor/explore) from your task.
  Includes full file content for pivots.
  Examples:
  - `run_pipeline({ "task": "fix JWT validation bug" })` — auto-detect
  - `run_pipeline({ "task": "refactor db layer", "preset": "refactor" })` — explicit
  - `run_pipeline({ "task": "add auth", "observation": "using JWT" })` — save insight in same call

### Other MCP tools (use only when run_pipeline is insufficient)
- `get_skeleton` — **preferred over Read** for inspecting files (minimal/standard/detailed detail levels, 70-90% token savings)
- `index_status` — indexing status and health check
- `expand_vexp_ref` — expand V-REF hash placeholders in v2 compact output

### Workflow
1. `run_pipeline("your task")` — ALWAYS FIRST. Returns pivots + impact + memories in 1 call
2. Need more detail on a file? Use `get_skeleton({ files: [...], detail: "detailed" })` — avoid Read unless editing
3. Make targeted changes based on the context returned
4. `run_pipeline` again ONLY if you need more context during implementation
5. Do NOT chain multiple vexp calls — one `run_pipeline` replaces capsule + impact + memory + observation

### Subagent / Explore / Plan mode
- Subagents CAN and MUST call `run_pipeline` — always include the task description
- The PreToolUse hook blocks Grep/Glob when vexp daemon is running
- Do NOT spawn Agent(Explore) to freely search — call `run_pipeline` first,
  then pass the returned context into the agent prompt if needed
- Always: `run_pipeline` → get context → spawn agent with context

### Smart Features (automatic — no action needed)
- **Intent Detection**: auto-detects from your task keywords. "fix bug" → Debug, "refactor" → blast-radius, "add" → Modify
- **Hybrid Search**: keyword + semantic + graph centrality ranking
- **Session Memory**: auto-captures observations; memories auto-surfaced in results
- **LSP Bridge**: VS Code captures type-resolved call edges
- **Change Coupling**: co-changed files included as related context

### Advanced Parameters
- `preset: "debug"` — forces debug mode (capsule+tests+impact+memory)
- `preset: "refactor"` — deep impact analysis (depth 5)
- `max_tokens: 12000` — increase total budget for complex tasks
- `include_tests: true` — include test files in results
- `include_file_content: false` — omit full file content (lighter response)

### Multi-Repo Workspaces
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope.
Use `index_status` to discover available repo aliases.

---

## Commands

```bash
pnpm dev                    # dev server (Next.js)
pnpm build                  # production build
pnpm lint                   # ESLint — zero warnings enforced
pnpm typecheck              # tsc --noEmit
pnpm test                   # vitest run (unit)
pnpm test:watch             # vitest watch
pnpm test:e2e               # Playwright E2E
pnpm generate:types         # regenerate src/payload-types.ts from Payload schema
pnpm generate:importmap     # regenerate Payload admin importMap.js
pnpm migrate:create         # scaffold a new DB migration
pnpm migrate                # run pending migrations
pnpm tenant:seed <slug>     # seed/re-seed a specific tenant's pages
```

Single test file: `pnpm test path/to/file.test.ts`

Dev preview for a specific tenant: `http://localhost:3000/tenant/<domain>/en/`

Example: `http://localhost:3000/tenant/acme.com/en/`

---

## Architecture

See `docs/ARCHITECTURE.md` for full detail. Summary below.

### Multi-tenant routing

```
Request
  → middleware.ts            injects x-tenant-domain header from Host (prod)
                             or /tenant/<domain> prefix (dev)
  → app/(frontend)/[locale]/[[...slug]]/page.tsx
      resolveTenant(domain)  → TenantConfig (from in-memory registry)
      getPage(tenantId, slug) → Page (from Payload DB, ISR-cached)
      TenantPageRenderer     → tenant-specific React component tree
```

Middleware is Edge-compatible and intentionally thin — it only injects the domain header. All config/DB access happens in Node.js page components.

### Tenant registry

Each tenant lives in `src/tenants/<slug>/`:

```
src/tenants/<slug>/
  tenant.config.ts   # TenantConfig — domains, locales, theme tokens, nav
  seed.ts            # idempotent DB seed for pages + media
```

`src/tenants/registry.ts` imports all configs and validates them against `TenantConfigSchema` at startup. Add new tenants there. This file is imported by middleware (Edge) — no Node.js-only imports.

### Content model — design in code, content in CMS

**Payload CMS stores only content**: text fields, rich text, and image uploads. Layout, HTML structure, and visual design are never stored in the CMS.

Each `Page` document has:
- `slug` — URL path segment (`home` → `/`)
- `pageTemplate` — free-text key mapping to a tenant component (e.g. `landing`, `portfolio-item`)
- Structured content groups: `heroSection`, `featuresSection`, `bodyContent`, `contactDetails`, `ctaSection`, `meta`

Editors can only modify text and images. They cannot alter layout or component structure.

### Tenant component isolation

**No components are shared between tenants.** Every tenant has its own complete component tree under `src/tenants/<slug>/components/`:

```
src/tenants/<slug>/
  tenant.config.ts
  seed.ts
  components/
    Nav.tsx            # top navigation
    Footer.tsx         # footer
    pages/
      LandingPage.tsx  # one file per page template
      AboutPage.tsx
      ...
    renderer.tsx       # owns layout: Nav + main + Footer, maps pageTemplate → page component
```

`TenantPageRenderer` (`src/components/layouts/TenantPageRenderer.tsx`) dispatches to the right tenant renderer by `config.slug`. It must never import from another tenant's directory.

### Flexible page tree

Page structure is per-tenant, defined in `tenant.config.ts` via `navigation` and `enabledPages` — no platform-wide enum. A tenant can use any template keys (`portfolio`, `case-study`, `team`, etc.) without touching platform code.

`pageTemplate` on each Page document is a free-text string. The tenant's `renderer.tsx` maps it to the correct page component. Nav and Footer are rendered by `renderer.tsx`, not by individual page components.

### ISR caching + revalidation

Pages are cached with `unstable_cache` tagged by `tenant:locale:slug`. Payload `afterChange`/`afterDelete` hooks call `revalidateTag` to surgically bust cache when editors save. Tag helpers are in `src/lib/revalidation/`.

---

## After schema changes

When changing Payload collection schemas (adding fields, renaming, etc.):

```bash
pnpm migrate:create   # scaffold SQL migration for the schema change
pnpm migrate          # apply pending migrations to the DB
pnpm generate:types   # regenerate src/payload-types.ts
```

`payload-types.ts` is gitignored and auto-generated. Always regenerate it after migrations.
