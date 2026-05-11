# 360IT Multi-Tenant Web Agency Platform

One Next.js 15 + Payload CMS 3 app that hosts many client websites. Tenant is identified by `Host` header; content is scoped per tenant in PostgreSQL.

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres + MinIO
docker compose up -d

# 3. Copy env
cp .env.example .env.local  # edit as needed

# 4. Start dev server
pnpm dev
```

- Admin: http://localhost:3000/admin
- Platform root (no tenants): http://localhost:3000
- Fixture preview: http://localhost:3000/tenant/__fixture__.test/en

## Seed the fixture tenant

```bash
pnpm tenant:seed __fixture__
```

## Run tests

```bash
pnpm test          # Vitest unit tests
pnpm test:e2e      # Playwright (requires dev server)
pnpm typecheck     # TypeScript
pnpm lint          # ESLint
```

## Key docs

- `docs/ARCHITECTURE.md` — system diagrams
- `docs/ADDING_A_TENANT.md` — step-by-step guide
- `docs/TENANT_CONFIG_SCHEMA.md` — config reference
- `docs/CONVENTIONS.md` — naming and file placement
- `CLAUDE.md` — AI agent instructions
