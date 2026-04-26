## Goal

Reduce surface area, unify patterns, and align to APT principles (one canonical home per responsibility, design tokens only, state-aware surfaces, AI as augmentation). Keep the current mock API layer — no Lovable Cloud yet.

## Diagnosis — what's too much today

- **8 top-level routes** (Dashboard, Exercises, Workouts, Programs, Schedule, Sessions, Snapshots, Admin) — Sessions duplicates Schedule; Exercises/Workouts/Programs are three near-identical CRUD pages.
- **Inconsistent list patterns**: each list page rebuilds its own search bar, filter chips, difficulty badge logic, empty state, and loading state.
- **Imports scattered**: BodySpec import lives in `Snapshots.tsx` *and* `SnapshotImportDialog.tsx`; Blood panel import is its own dialog; Admin has bulk import for everything else. Three different shapes.
- **Snapshots page mixes** scan history, blood panels, and a JSON paste form in tabs — too many concerns.
- **Dashboard** shows 5 KPI cards + insights + schedule strip + progress compare + current snapshot + recommendation — every section competes for "hero" emphasis (violates APT: one hero per view).

## Target information architecture (aggressive consolidation)

Reduce 8 routes → 5:

| Route | Replaces | Purpose |
|---|---|---|
| `/dashboard` | Dashboard | One hero (latest insight), one secondary band (KPIs), one tertiary band (next session). Nothing else. |
| `/training` | Exercises + Workouts + Programs | Single hub with tabs: **Library** (exercises) · **Workouts** · **Programs**. Shared search + filter shell. |
| `/schedule` | Schedule + Sessions | Calendar/list view; "Sessions" becomes the *Completed* filter on the same page. |
| `/health` | Snapshots (renamed) | Two tabs: **Body Scans** (DEXA/BodySpec) · **Blood Panels** (RythmHealth). View-only; no import UI here. |
| `/admin` | Admin | Single home for **all** imports: Body Scans, Blood Panels, Exercises, Workouts, Programs. Plus Import History. |

`/sessions` and `/snapshots` redirect to their replacements so existing links don't break.

## Shared design system primitives (APT-aligned)

Create a small set of reusable components so every list page looks and behaves the same. All built on existing shadcn primitives, using only semantic tokens.

1. **`PageHeader`** — title + description + optional actions slot. One per page.
2. **`ListToolbar`** — search input + filter chip row + result count. Used by Library / Workouts / Programs / Schedule / Imports / Insights.
3. **`EntityCard`** — standard card for a list item: title, metadata row, badge row, action menu. Replaces the bespoke cards in each page.
4. **`EmptyState`** — icon + heading + 1-sentence body + single CTA. Replaces the 6+ ad-hoc empty cards.
5. **`StatusBadge`** — one place for difficulty / out-of-range / status colors (today these are reimplemented in 4 files).
6. **`SectionCard`** — wraps `Card` with consistent padding, header, and one of `default | subtle | feature` variants per APT card matrix.

These live in `src/components/common/`. Existing pages refactor to use them — no new design tokens, no new colors.

## Health Data redesign (`/health`)

- Rename route `/snapshots` → `/health`; keep redirect.
- Two tabs only: **Body Scans** and **Blood Panels**. Drop the third "Import" tab — imports move to Admin.
- Each tab uses the same layout: left rail = `EntityCard` list (date + source + flag count), right pane = detail view.
- Body Scans detail: existing key-metrics grid + regional changes + Compare-to-previous (already built).
- Blood Panels detail: existing `BloodPanelDetail` component, with an "Generate Insights" action that calls the existing analyze hook.
- Source labels normalized: "BodySpec (DEXA)" and "RythmHealth (Blood Panel)".

## Admin redesign (`/admin`) — single home for imports

Tabs:
1. **Imports** — one unified flow with a source picker:
   - Body Scan (BodySpec JSON) — moves logic out of `Snapshots.tsx` and `SnapshotImportDialog.tsx`
   - Blood Panel (RythmHealth CSV) — moves out of `BloodPanelImportDialog.tsx`
   - Exercises (JSON array)
   - Workouts (JSON array)
   - Programs (JSON array)
   - Each picker shows: format hint, "Load Sample" button, paste area, **Validate & Preview**, **Import**. Identical UX for every type.
2. **Import History** — already exists, kept as-is.
3. **Data Health** *(new, small)* — counts of records per entity + "last import" timestamps so the admin sees the system state at a glance.

The two existing import dialogs (`SnapshotImportDialog`, `BloodPanelImportDialog`) get retired; their parsing logic moves into `src/lib/importers/{bodyspec,rythmhealth,exercises,workouts,programs}.ts` so it can be shared and unit-tested.

## Training hub (`/training`)

One page, three tabs, one toolbar. Each tab is a `ListToolbar` + grid of `EntityCard`.

- **Library tab**: existing exercise filtering by movement pattern.
- **Workouts tab**: search + filter by difficulty.
- **Programs tab**: search + filter by goal.

Create / Edit dialogs are reused as-is (`ExerciseDialog`, `WorkoutDialog`, the inline Programs dialog stays). Routing: `/training?tab=library|workouts|programs`. Deep links from Dashboard land on the right tab.

## Dashboard simplification

Reduce to three bands, one hero each:

1. **Hero — Today's Insight**: the single highest-priority adaptive recommendation, with a "Why" explanation grounded in real data (last scan delta + adherence). One CTA. Uses `feature` card variant.
2. **Body composition KPIs**: 4 metrics (Weight, Body Fat %, Lean Mass, Adherence) — drop the 5th, use `default` card.
3. **Up next**: next 3 scheduled sessions only. Link to `/schedule` for full view. `subtle` card.

Move "Progress Compare" + "Current Snapshot" into `/health` where they belong (already there). Dashboard stops being a kitchen sink.

## AI Insights surface (mock-data backed)

A new component `AIInsightsPanel` rendered in two places:
- Health Data → Body Scan detail (food + training suggestions from latest delta)
- Health Data → Blood Panel detail (food + lifestyle suggestions from out-of-range markers)

**No new AI calls yet** — extends the existing rule-based engines (`src/lib/protocol.ts`, `src/lib/blood-marker-engine.ts`, `src/lib/adaptive-engine.ts`) to emit a structured `Insight` shape:

```ts
{ id, severity, category: 'food'|'training'|'schedule'|'lifestyle',
  title, rationale, evidence: { source, value, reference }, actions: [...] }
```

Every insight must cite `evidence` (which scan, which marker, which value vs. reference range) — enforces the user's "no guessing or hyperbole" rule. Insights without evidence are filtered out.

A small adapter layer (`src/lib/ai/insights.ts`) is added now with the right shape so that when Lovable AI is enabled later, swapping the rule engine for an LLM-grounded version is a one-file change. No backend code added in this phase.

## File-level work breakdown

**New files**
- `src/components/common/PageHeader.tsx`
- `src/components/common/ListToolbar.tsx`
- `src/components/common/EntityCard.tsx`
- `src/components/common/EmptyState.tsx`
- `src/components/common/StatusBadge.tsx`
- `src/components/common/SectionCard.tsx`
- `src/components/AIInsightsPanel.tsx`
- `src/pages/Training.tsx` (replaces Exercises/Workouts/Programs pages as routed entry)
- `src/pages/Health.tsx` (replaces Snapshots)
- `src/lib/importers/bodyspec.ts`
- `src/lib/importers/rythmhealth.ts`
- `src/lib/importers/index.ts`
- `src/lib/ai/insights.ts`

**Refactored**
- `src/App.tsx` — new routes, redirects from `/snapshots`, `/sessions`, `/exercises`, `/workouts`, `/programs`.
- `src/components/Layout.tsx` — nav reduced to 5 items.
- `src/pages/Admin.tsx` — adds Body Scan + Blood Panel import sources; uses new importers.
- `src/pages/Dashboard.tsx` — three-band layout, single hero.
- `src/pages/Schedule.tsx` — adds "Completed" filter that supersedes the Sessions page.

**Removed**
- `src/pages/Exercises.tsx`, `src/pages/Workouts.tsx`, `src/pages/Programs.tsx`, `src/pages/Sessions.tsx`, `src/pages/Snapshots.tsx` (logic merged into Training/Schedule/Health).
- `src/components/SnapshotImportDialog.tsx`, `src/components/BloodPanelImportDialog.tsx` (logic moves to Admin + importers).

**Unchanged**
- API client (`src/lib/api/*`) — same mock layer, same hooks.
- `WorkoutStart`, `Settings`, auth, protected routes.
- Existing dialogs (`ExerciseDialog`, `WorkoutDialog`, `BloodPanelDetail`, `DeleteConfirmDialog`).

## APT principle alignment (cross-check)

| APT rule | How this plan satisfies it |
|---|---|
| One canonical source per topic | Imports live only in Admin; difficulty colors live only in `StatusBadge`; insights only in `lib/ai/insights.ts`. |
| Design complete behavior | Every list surface has loading / empty / error / success defined via shared primitives. |
| Structure before speed | Shared common components built first; pages refactor onto them. |
| API-first where it matters | Import parsing extracted to `src/lib/importers/*` with typed inputs/outputs. |
| AI follows the system | `Insight` shape requires evidence citations; LLM swap is a single adapter file later. |
| Boundaries prevent category errors | Pages render; importers parse; engines reason; hooks fetch. No mixing. |

## Out of scope (deferred)

- Lovable Cloud / real persistence + auth (separate plan).
- Real LLM-grounded insights via Lovable AI (adapter ready; enable later).
- Mobile-specific layout polish beyond what shared primitives give for free.
- Migrating from in-memory mock data to D1.

## Acceptance checks

- Nav has exactly 5 items (+ Admin if role).
- `/snapshots`, `/sessions`, `/exercises`, `/workouts`, `/programs` all redirect.
- Every list page (Training tabs, Schedule, Admin Imports) uses `ListToolbar` + `EntityCard` + `EmptyState`.
- Body Scan and Blood Panel imports are reachable only from `/admin`.
- Dashboard renders only three bands; one is a `feature` card.
- Every insight rendered in the UI has a non-empty `evidence` field; insights without evidence do not display.
