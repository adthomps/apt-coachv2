# APT Alignment Plan — Thinking, Design, File Structure (Cloudflare-Ready)

Reorganize the repo so it follows APT doctrine (`thinking.md`, `design.md`, `architecture.md`, `system-standards.md`) and slots cleanly into the APT Cloudflare baseline (Pages + Workers + D1/KV/R2) — without breaking the current mock/demo running on Vite.

The key insight: APT's `apps/` + `packages/` monorepo split, the responsibility map, and the mock-vs-real boundary are already partially reflected (`http-client.ts` has a `USE_MOCK_API` flag). We need to formalize boundaries, evict business logic from UI, version the prompts, and document each layer.

## Workstream 1 — Project Doctrine (External Alignment)

Add an APT adoption layer at the repo root. These files declare how this project applies APT canonical doctrine; they don't change runtime behavior.

```text
docs/apt/
  README.md                     # Pointer to apt-principles canonical source
  adoption.md                   # What APT layers this project adopts (and exceptions)
  decisions/
    0001-mock-first-frontend.md
    0002-cloudflare-target-stack.md
    0003-blue-primary-teal-accent.md
    0004-roles-table-deferred.md
  responsibility-matrix.md      # APT responsibility map filled in for this repo
  boundary-map.md               # Which folder owns what; forbidden import directions
  state-map.md                  # Required UI states per feature (loading/empty/error/...)
references/
  design-tokens.json            # Mirror of APT tokens (already in src/index.css; this is the portable contract)
  architecture-map.json         # Boundary + ownership in machine-readable form
```

These satisfy APT's "Required Artifacts" for both Design and Architecture without forcing a monorepo split today.

## Workstream 2 — Internal File Structure (Cloudflare-Ready, Mock Intact)

Goal: introduce the `apps/web` + `packages/*` shape APT recommends, but stage it so day-1 the existing Vite app keeps working unchanged.

### Phase A — Logical layering inside `src/` (no folder move yet)

Re-organize `src/lib` to make the Cloudflare boundary explicit:

```text
src/
  features/                  # NEW — feature-vertical slices (UI + hooks + view-models)
    today/
    dashboard/
    health/
    training/
    schedule/
  services/                  # NEW — frontend service layer; the ONLY place that calls api client
    healthService.ts
    trainingService.ts
    scheduleService.ts
    nutritionService.ts
  domain/                    # NEW — pure business logic, framework-free, portable to Worker
    protocol.ts              # moved from src/lib/protocol.ts
    blood-marker-engine.ts
    adaptive-engine.ts
    nutrition-targets.ts
    schedule-sync.ts
    selectors/health.ts
    ai/
      insights.ts
      session-insights.ts
      prompts/               # NEW — versioned prompt files (one .md per prompt)
        body-scan-summary.v1.md
        blood-panel-summary.v1.md
  data/                      # renamed from src/lib/api
    types.ts                 # canonical contracts (becomes the worker/D1 source of truth)
    http-client.ts           # transport + auth header injection
    mock/
      client.ts              # current mock client
      fixtures.ts            # current mock-data.ts
    real/
      client.ts              # NEW shell — implements same interface against /api
    index.ts                 # picks mock vs real based on USE_MOCK_API
  ui/                        # shadcn primitives + APT presentational components only
    primitives/              # current src/components/ui
    apt/                     # SectionCard, KpiHeroTile, ToneChip, SourceBadge, …
  pages/                     # route shells only — no business logic, no fetch
  hooks/
  contexts/
  index.css
  main.tsx
  App.tsx
```

### Phase B — Forbidden-import rules (enforced via ESLint `no-restricted-imports`)

| From → To | Allowed? | Rationale |
|---|---|---|
| `pages/**` → `data/**` directly | NO | Pages must go through `services/**` or `hooks/**` |
| `ui/**` → `services/**` or `data/**` | NO | UI is presentational; no business calls |
| `domain/**` → `react`, `react-router-dom`, `@/hooks` | NO | Domain must be portable to Worker |
| `domain/**` → `data/**` | NO | Domain operates on plain types, not the transport |
| `features/**` → other `features/**/internals` | NO | Cross-feature uses public exports only |

A single `.eslintrc` block + `eslint-plugin-boundaries` (or `import/no-restricted-paths`) makes these guardrails real.

### Phase C — Mock/real switch hardening

`src/data/index.ts` becomes the single switch:

```ts
export const api = USE_MOCK_API ? mockClient : realClient;
```

`realClient` ships as a thin TODO shell that throws "not implemented" per method — present so the boundary exists, dormant until a Worker is wired. This is the only file that needs to change on cutover.

### Phase D — Cloudflare cutover map (deferred work, documented now)

Document — but do not yet create — the eventual layout:

```text
apps/
  web/                # current Vite app (move src/ here)
  worker/             # NEW Hono worker
    src/
      routes/         # thin transport layer
      services/       # owns business logic — imports from packages/domain
      middleware/
      index.ts
packages/
  domain/             # promote src/domain/ to a package — same code, no React
  data-contracts/     # promote src/data/types.ts to a package — shared by web + worker
  ui/                 # optional later: extract APT components
  config/             # tokens, env helpers
```

Because `src/domain/` and `src/data/types.ts` already have zero React/router dependencies (after Phase A), the Phase D promotion is a `git mv` + `package.json` work — no logic change.

## Workstream 3 — APT Design Conformance (Internal)

A few residual gaps from the previous APT pass:

- **State-map coverage**: each major page declares its loading / empty / error / disabled / permission states in `docs/apt/state-map.md`; missing states get added (DEXA error retry, panel parse-error, today offline banner).
- **`ui/apt/ToneChip`**: extract the chip rendering currently duplicated across `KpiHeroTile`, `SignalChipStrip`, `SourceSummaryCard`, `DeltaValue`. Single semantic-tone component.
- **Header/footer template parity**: confirm Layout matches the APT hybrid header contract (sticky, `bg-card/80`, backdrop blur, `h-14`–`h-16`, route-aware active state in accent).
- **Prompts**: move every inline prompt/template (currently embedded in `lib/ai/insights.ts`) into `domain/ai/prompts/*.md` with a version header. Loader reads the file at build time.

## Workstream 4 — Quiet Compliance Fixes

Discovered while exploring; fix as part of this pass:

- `src/components/health/views/RythmBloodView.tsx` calls `useMemo` after two early returns → currently throws "Rendered more hooks than during the previous render." Move the `topChanges` `useMemo` above the early returns.

## Out of Scope (Deferred to a Later Plan)

- Actually creating `apps/` and `packages/` directories — Phase D is documented only.
- Building the Hono worker, D1 schema, R2 bucket.
- Auth provider integration (Lovable Cloud) — captured as decision 0004.
- Light-mode visual audit beyond what's already in `index.css`.
- Replacing the deterministic engines with LLM calls.

## Risk & Containment (per APT Change Containment)

- **Low risk**: doctrine docs, ESLint rules, ToneChip extraction, hook-order fix.
- **Medium risk**: folder reorganization inside `src/` (Phase A) — done as one commit per top-level move with import-path updates verified by `tsc`.
- **High risk (deferred)**: monorepo extraction (Phase D), real backend cutover. Both gated behind decision records.

## Deliverables

1. `docs/apt/` + `references/` doctrine package committed.
2. `src/` reorganized into `features/`, `services/`, `domain/`, `data/`, `ui/` with all imports updated.
3. ESLint boundary rules enforcing the responsibility map.
4. `domain/ai/prompts/*.md` extracted; insights loader reads them.
5. RythmBloodView hook-order bug fixed.
6. Phase D Cloudflare cutover map written but not executed.
7. Mock demo unchanged: `USE_MOCK_API = true` still works end-to-end.
