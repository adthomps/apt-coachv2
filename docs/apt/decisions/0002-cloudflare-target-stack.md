# ADR 0002 — Cloudflare Target Stack

- **Status:** Accepted (target; not yet deployed)
- **Date:** 2026-05
- **Risk:** High (deferred)

## Context

APT's architecture baseline standardizes on Cloudflare Pages + Workers + D1 +
KV + R2 with GitHub as source of truth and preview-first deployment.

## Decision

When this project graduates from Lovable preview to a hosted backend, the
target stack is:

- **Cloudflare Pages** — static hosting for the Vite-built frontend.
- **Cloudflare Workers + Hono** — API surface at `/api/*`.
- **D1** — relational store for snapshots, panels, programs, sessions.
- **R2** — object storage for raw imports (BodySpec JSON, Withings CSV, Skulpt CSV).
- **KV** — short-lived caches (auth session, ICS feed cache).

## Consequences

- Folder shape inside `src/` already mirrors the future monorepo layout
  (`domain/`, `data/types.ts` are React-free and ready to promote to
  `packages/domain` and `packages/data-contracts`).
- ADR 0004 covers the auth/RLS approach.
- Until cutover, Lovable preview is the only deployment surface.
