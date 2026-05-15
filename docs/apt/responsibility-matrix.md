# Responsibility Matrix

Mapping of APT canonical responsibilities to folders in this repo.

| Concern | Owner Folder | Rule |
|---|---|---|
| Rendering UI | `src/components/**`, `src/ui/apt/**`, `src/features/**/components` | Presentational. No `fetch`, no business rules. |
| Route shells | `src/pages/**` | Compose features. No business logic. No direct `data/` imports. |
| API orchestration (frontend) | `src/services/**`, `src/hooks/use-api-queries.ts` | The only callers of `src/data/`. |
| HTTP transport | `src/data/http-client.ts` | Auth header injection, base URL, error envelope. |
| Mock client | `src/data/mock/**` | Active in demo mode. |
| Real client (future Worker) | `src/data/real/**` | TODO shells until cutover. |
| Domain types / contracts | `src/data/types.ts` | Source of truth. Shared with future Worker. |
| Business logic | `src/domain/**` | Pure, framework-free, portable. No React, no router, no `data/`. |
| AI prompts | `src/domain/ai/prompts/*.md` | Versioned, named, auditable. |
| Design tokens | `src/index.css`, `tailwind.config.ts`, `references/design-tokens.json` | HSL only. |
| Logging / telemetry | `src/services/**` (future middleware) | Structured, traceable. |
| Auth (future) | `src/data/http-client.ts` + Worker middleware | Trust boundary lives server-side. |

## Forbidden Flows

- `pages/**` MUST NOT import from `data/**`.
- `components/**` and `ui/**` MUST NOT import from `services/**` or `data/**`.
- `domain/**` MUST NOT import React, routers, hooks, or `data/**`.
- `features/A/**` MUST NOT reach into `features/B/internals/**`.
