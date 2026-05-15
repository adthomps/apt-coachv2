# APT Conformance Pass + Today/Dashboard ↔ Health Linkage

Two coordinated workstreams: (1) audit every UI surface against APT color & interaction rules, (2) make insights/data bidirectionally navigable between Today, Dashboard, and the new per-source Health views.

## 1. APT Color & Interaction Audit

APT rules (from `apt-principles/design.md` + `references/design-tokens.json`):
- **Blue (220)** = brand, primary CTAs, links, focus rings, active nav.
- **Accent/teal (165)** = section identity, selection, success, badges, chart accents — never the default CTA.
- **Semantic feedback** (success / warning / destructive) only for state, never decoration.
- **Disabled** = reduced contrast, never hidden.
- **Calm motion only**; subtle fade / hover lift; 140–220ms.
- **No raw colors**; semantic tokens only.

### Findings to fix

| File | Issue | Fix |
|---|---|---|
| `pages/NotFound.tsx` | `text-blue-500/700` raw color | `text-primary hover:text-primary-hover` |
| `components/sessions/HeartRateZoneBar.tsx` | `bg-sky-500/70`, `bg-orange-500/70` raw | Map zones to semantic tokens (`primary`, `accent`, `warning`, `destructive`) |
| `components/ui/toast.tsx` | shadcn default `red-300/50/400/600` inside destructive variant | Replace with `destructive`/`destructive-foreground` aliases |
| Dashboard / Health value-compare chips | Already use `success`/`destructive`/`warning`/`muted` — keep, but unify the `fav/unfav/neutral` vs `delta` chip styles into one shared `<ToneChip>` so every page renders compares identically |
| Selected/active states across `HealthSourceTabs`, dashboard cards, chips | Today some use `primary`, some `accent`. Per APT: **selection/section identity = accent (teal)**, **primary CTA = blue**. Standardize: tabs/segmented active state → accent; buttons/links → primary |
| Focus rings | Confirm `focus-visible:ring-ring` everywhere; add to custom buttons in `KpiHeroTile`, `SourcePageShell` jump-to-insights |
| Motion | Audit any `duration-500/700` on hover; cap at `duration-200` per APT 140–220ms |

### New shared primitive

`src/components/apt/ToneChip.tsx` — single source of truth for value-compare chips:
- `tone: 'fav' | 'unfav' | 'neutral' | 'warning'` (semantic, not color names)
- consistent radius, padding, arrow icon, aria-label for screen readers
- replaces ad-hoc chip styles in `KpiHeroTile`, `SourceSummaryCard`, `SignalChipStrip`, `DeltaValue`

### Active-state convention (documented in `index.css` comment block)

- Pill/tab active background: `bg-accent/15 text-accent border-accent/30`
- Primary CTA: `bg-primary text-primary-foreground hover:bg-primary-hover`
- Link: `text-primary underline-offset-4 hover:underline`

## 2. Today ↔ Dashboard ↔ Health Linkage

Currently Health source views consume `useSnapshots`, `useBloodPanels`, `useHealthCheckins`, but Today and Dashboard don't deep-link into them, and the source views don't surface today's checkin context.

### A. From Dashboard / Today → Health (deep links)

- `SourceSummaryCard` (Dashboard) — wrap each card title + "View details" affordance with `<Link to="/health?source={dexa|rythm|withings-scale|...}">`.
- Dashboard `Insight` items (body scan + blood panel) → each insight gets a "See in Health" link to the relevant source view.
- Today's protocol recommendation card → "Why this?" link to `/health?source=rythm` (or whichever source drove the recommendation).
- Today's body-comp summary chip → links to `/health?source=dexa`.

### B. Health page accepts `?source=` query param

- `Health.tsx` reads `useSearchParams` → seeds `HealthSourceTabs` initial selection.
- Subsequent tab changes update the URL (`replace: true`) so links are shareable and back/forward works.

### C. From Health → Today/Dashboard (back-references)

Each source view's `SourcePageShell` gets a small "Used in" footer strip:
- DEXA / Skulpt / Withings Scale → "Drives today's training emphasis" → `/today`
- Rythm Blood → "Informs today's food guidance" → `/today`
- Apple / Withings BeamO → "Feeds dashboard recovery signal" → `/dashboard`

### D. Shared selectors so numbers match exactly

Create `src/lib/selectors/health.ts`:
- `selectLatestSnapshot(snapshots)` — single canonical "latest DEXA"
- `selectComparePair(snapshots, mode)` — returns `{ current, baseline }` used by both Dashboard `SourceSummaryCard` and Health `DexaView` so deltas are always identical.
- `selectLatestPanel(panels)`, `selectPanelComparePair(panels, mode)`.
- `selectTodayCheckin(checkins)` — used by Today and by `CompanionOverlayStrip` so the "today's weight" overlay on DEXA matches the number on Today.

Refactor `Dashboard.tsx`, `Today.tsx`, and the source views to consume these selectors instead of inline `.sort()[0]` patterns. This is the structural fix that guarantees the same number shows in all three places.

### E. Insight provenance

Add an optional `source: HealthSourceId` field on the existing `Insight` type produced by `getBodyScanInsights` / `getBloodPanelInsights`. Dashboard/Today render the source as a small `<SourceBadge>` next to each insight, and the badge is the deep link.

## Out of Scope

- No new data sources or API changes.
- No edits to importer schemas.
- No mobile redesign; responsive parity only.
- No light-mode work beyond ensuring tokens already defined still render.

## Files Touched (estimate)

New: `src/components/apt/ToneChip.tsx`, `src/lib/selectors/health.ts`.
Edited: `pages/NotFound.tsx`, `pages/Today.tsx`, `pages/Dashboard.tsx`, `pages/Health.tsx`, `components/sessions/HeartRateZoneBar.tsx`, `components/ui/toast.tsx`, all `components/health/views/*`, `components/health/KpiHeroTile.tsx`, `components/health/HealthSourceTabs.tsx`, `components/health/SourcePageShell.tsx`, `components/dashboard/SourceSummaryCard.tsx`, `components/dashboard/SignalChipStrip.tsx`, `lib/ai/insights.ts` (add source field), `index.css` (active-state convention comment).
