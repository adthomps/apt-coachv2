# ADR 0001 — Mock-First Frontend

- **Status:** Accepted
- **Date:** 2026-05
- **Risk:** Medium

## Context

The backend (Cloudflare Worker + D1) is not built yet, but stakeholders need an
interactive demo of body-composition-aware coaching across DEXA, Rythm,
Withings, Skulpt, Apple Health, and Lumen.

## Decision

Ship the frontend against an in-process mock API (`src/data/mock/`) selected by
the `USE_MOCK_API` flag in `src/data/index.ts`. The mock client implements the
same TypeScript interface as the future real client (`src/data/real/`).

## Consequences

- The demo runs end-to-end with no backend.
- Cutover to a real Worker is a single-file change (`USE_MOCK_API = false`)
  plus method implementations in `real/client.ts`.
- All business logic lives in `src/domain/` (framework-free), so the same
  engines run unchanged inside the Worker after promotion to a package.
