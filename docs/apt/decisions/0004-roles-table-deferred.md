# ADR 0004 — Roles Table Deferred Until Cloud Cutover

- **Status:** Accepted
- **Date:** 2026-05
- **Risk:** Medium (security-adjacent)

## Context

APT security doctrine requires a separate `user_roles` table with a security-
definer `has_role()` function and RLS policies — never roles stored on the
profile/users row.

## Decision

This project does not have a backend yet; there are no users, no auth, no
roles. We defer the entire roles model until the Cloudflare cutover (ADR 0002).
At that point we will provision the canonical pattern from APT
`security.md` — `app_role` enum, `user_roles` table, `has_role()` SECURITY
DEFINER function — before any feature reads role state.

## Guardrails Today

- No client-side admin checks via `localStorage` or hardcoded credentials.
- The `/admin` route is demo-only; no privileged operations behind it.
- `user_id` does not appear on any mock entity in a way that implies
  authorization.

## Consequences

When auth lands, the migration is additive: add the table + function, then
gate `/admin` behind `has_role(auth.uid(), 'admin')`. No retrofit of existing
mock data is required.
