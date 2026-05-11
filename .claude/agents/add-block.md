# Agent: Add Block

## Goal
Create a new Payload block + React component pair in this multi-tenant Next.js + Payload platform.

## Context
- Blocks live at `src/blocks/<BlockName>/`
- Each block is two files: `index.ts` (Payload config) and `Component.tsx` (React render)
- Block types are added to `src/collections/Pages.ts` `layout.blocks` array
- `TenantPageRenderer` in `src/components/layouts/TenantPageRenderer.tsx` needs a new `case`
- Types come from `src/payload-types.ts` (auto-generated)

## Steps to follow
1. Read `src/blocks/Hero/index.ts` and `src/blocks/Hero/Component.tsx` as reference
2. Create `src/blocks/<Name>/index.ts` with the Payload Block config
3. Create `src/blocks/<Name>/Component.tsx` with the React component
4. Add the block import and entry to `src/collections/Pages.ts` blocks array
5. Add a case in `src/components/layouts/TenantPageRenderer.tsx`
6. Run `pnpm generate:types` to regenerate types
7. Update `src/payload-types.ts` if needed (or instruct user to run generate:types)

## Do not
- Do not modify `src/payload.config.ts`
- Do not create new collections for blocks
- Do not add client-side state — blocks are server components
