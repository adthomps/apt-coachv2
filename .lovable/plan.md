## Goal

Remove the duplicated DEXA / Rythm / Withings presentation on the dashboard and give Supporting Insights a dedicated row.

## Current dashboard order

1. AI Health Summary hero
2. Signal chip strip
3. **3-up source cards** (SourceSummaryCard) — DEXA / Rythm / Withings
4. Bottom row: Training Pulse · Apple Health · Supporting Insights
5. **Health Direction grid** (HealthDirectionGrid) — DEXA / Rythm / Withings (duplicate)

## Target dashboard order

1. AI Health Summary hero
2. Signal chip strip
3. **3-up source cards** (single, enriched)
4. Bottom row: Training Pulse · Apple Health (2-up, full width split)
5. **Supporting Insights** (own full-width row)

## Changes

### 1. Enrich `SourceSummaryCard` with the unique bits from `HealthDirectionGrid`

Add to the existing card (between Priority Action and footer):
- Optional **Food Guidance** block (label + short body) — currently only on the Health Direction grid.
- Optional **"Why this is the priority"** metric explainer link tied to a `metricKey` — currently only on the grid.

Props additions:
- `food?: string`
- `priorityMetricKey?: MetricKey`

KPI tiles already cover body fat / lean mass / markers / weight, so no structural change to the stats grid.

### 2. Update `Dashboard.tsx`

- Pass `food` and `priorityMetricKey` into each `SourceSummaryCard` using the same insight selection that `HealthDirectionGrid` does today (`bodyInsights.find(category === 'food')`, `panelInsights[0].actions[0]`, etc.).
- Remove the `<HealthDirectionGrid />` render and its import.
- Change the bottom row from 3-column to 2-column: Training Pulse + Apple Health.
- Add a new row below it that renders `<AIInsightsPanel>` full-width with the existing `supportingInsights` (raise the cap from 3 back to 6 since it now has the whole row).

### 3. Cleanup

- Leave `src/components/dashboard/HealthDirectionGrid.tsx` on disk (still imported nowhere else after change). It can be deleted in a follow-up if you confirm nothing else uses it — a quick grep shows only Dashboard imports it today, so safe to remove now if you'd like that included.

## Files touched

- `src/components/dashboard/SourceSummaryCard.tsx` — add food + metric explainer support
- `src/pages/Dashboard.tsx` — wire new props, drop HealthDirectionGrid, restructure bottom into two rows
- `src/components/dashboard/HealthDirectionGrid.tsx` — delete (assuming you want it removed)

## Out of scope

- Hero card, signal chip strip, Lumen, and Today page are unchanged.
