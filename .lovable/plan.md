## Goal
Make all three Health tabs (DEXA, Withings, Blood Panels) feel like one product. Same layout shell, same primitives for "stat at a glance", "change vs prior", "range vs reference", and "insights". Different data, identical scaffolding and reading order.

## Shared layout contract (applied to all 3 tabs)
```
┌─────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                │
│ [Tabs: DEXA · Withings · Blood Panels]                      │
├──────────────┬──────────────────────────────────────────────┤
│ Panel        │ 1. Stats-at-a-glance KPI strip (4 cards)     │
│ History      │    + "Jump to insights ↓" quick link          │
│ (left rail,  │ 2. Body Composition / Range Visualization     │
│  selectable, │    (tab-specific but same component shape)    │
│  delete)     │ 3. AI Insights (anchor: #insights)            │
│              │ 4. Detail breakdown (regional / markers / …)  │
└──────────────┴──────────────────────────────────────────────┘
```
- Left rail: always `lg:col-span-1`, shows date, summary line, status pill, delete button. Selecting an item drives the right pane. Withings currently has no left rail — we add one.
- Right pane: always `lg:col-span-3`, fixed reading order (KPI → composition/visual → insights → detail).
- Empty states unchanged in shape but adopt the same "Add / Import" CTA pattern.

## New shared primitives (`src/components/health/`)
1. **`HealthHistoryRail.tsx`** — selectable date list with status pill + delete. Drives DEXA, Withings, and Blood Panels rails (today they are 3 copies of the same JSX).
   - Props: `items: { id, date, summaryLine, badge?, onDelete }[]`, `selectedId`, `onSelect`.
2. **`KpiStat.tsx`** — single KPI card: icon, label, value, optional `delta` with consistent up/down/neutral color rules (invertible for "lower is better"). Replaces the 4 ad-hoc Card blocks duplicated in DEXA + Withings.
3. **`RangeBar.tsx`** (extract from `BloodPanelDetail.tsx`) — generic "value within reference range" bar. Reused by Blood Panel markers and a new "fat % vs healthy band" bar on DEXA/Withings.
4. **`DeltaValue.tsx`** — tiny inline component: `+1.2 lbs` / `-0.4%` with consistent coloring + invert flag. Used everywhere a change is shown.
5. **`InsightsAnchor.tsx`** — small "Jump to AI insights ↓" link that scrolls to `#insights`. Same affordance on every tab.

No new design tokens; uses existing `text-success` / `text-destructive` / `text-muted-foreground` and `SectionCard` variants per APT.

## Per-tab changes

### DEXA Scans (`scans` tab)
- Keep current 1/3 + 3/3 split; swap left rail for `HealthHistoryRail`, swap 4 KPI Cards for `KpiStat`.
- Add `InsightsAnchor` above KPIs.
- Reorder: KPI strip → **Body Composition** (Lean/Fat ratios + Regional) → **AI Insights** (`id="insights"`) → no change to bottom.
  - Currently AI Insights sits between KPIs and Body Composition; move below body composition so the visual block stays adjacent to the numbers it explains. Insights becomes the "what to do" close to the bottom on every tab.

### Withings (`withings` tab) — biggest change
- Introduce left **Reading History** rail (replaces the full-width "Reading History" list). Same component as DEXA.
- Right pane gets the standard order:
  1. KPI strip (already present, swap to `KpiStat`).
  2. **Trend Visualization** card — reuse `RangeBar` to show body-fat % vs typical healthy band, plus simple sparkline-style delta rows for last 5 readings (no chart library — bars only, matches existing aesthetic).
  3. **AI Insights** — wire `getBodyScanInsights(selectedReading, comparisonVsPrev)` so Withings finally gets insights (today it has none). Comparison built in-page from the next item in the sorted list.
  4. Notes block if present.
- Remove the trailing footnote about "import a DEXA scan" — relocate as a one-line muted hint inside the Trend Visualization card.

### Blood Panels (`blood` tab)
- Already matches the layout; just swap to `HealthHistoryRail`.
- Add a top **KPI strip** using `KpiStat` so this tab matches the others at-a-glance:
  1. Total markers
  2. Optimal count (success tone)
  3. Out of Range count (destructive tone)
  4. Panel date
  (These already exist inside `BloodPanelDetail` as a sub-summary — promote them to the top, remove the duplicate inside `BloodPanelDetail`.)
- Add `InsightsAnchor` above KPIs. Reorder: KPI → Marker categories (BloodPanelDetail body) → AI Insights (`id="insights"`) at the bottom.
- `BloodPanelDetail.tsx` updated to drop its internal 4-card summary and to use the shared `RangeBar`.

## Files affected
- **New**: `src/components/health/HealthHistoryRail.tsx`, `KpiStat.tsx`, `RangeBar.tsx`, `DeltaValue.tsx`, `InsightsAnchor.tsx`.
- **Edited**: `src/pages/Health.tsx` (all 3 tab bodies), `src/components/BloodPanelDetail.tsx` (extract RangeBar, drop top summary cards).
- No type changes, no API changes, no mock-data changes.

## States covered
Loading (existing), empty (existing per-tab CTAs preserved), single-item (delta hidden), selected-but-deleted (existing fallback to first item), no-comparison-available (delta hidden, KPI still renders).

## APT principles applied
- **Reusable systems over one-off screens**: 5 small primitives replace 3 parallel JSX trees.
- **Calm, structured, non-marketing**: same reading order across tabs lowers cognitive load.
- **Tokens over raw colors**: deltas standardized via `DeltaValue` using semantic tokens.
- **Presentational UI, logic at the page**: comparisons + insight selection stay in `Health.tsx`; primitives are dumb.

## Validation
- `tsc` clean.
- Manual check on `/health`: switch between all 3 tabs, confirm identical scaffold; select different items in each rail; verify delete flow; verify empty state on a tab with zero items; verify single-item case (no delta).
- Confirm the "Jump to insights ↓" anchor scrolls to the insights block on each tab.

## Out of scope (would be follow-ups)
- DEXA sub-tabs / Bone density / Compare-window picker (Phase 3 of the prior plan).
- Blood Signal Summary cards (Out of Range / Improved / Worsened deltas vs prior panel).
- Withings device sub-views (BPM, BeamO, U-Scan).
These build cleanly on the primitives introduced here.