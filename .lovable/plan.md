## Goal

Extend the science-grounded "what / why / focus" pattern (already wired into `KpiStat` + `MetricExplainer` + `metric-glossary.ts`) to the remaining health surfaces where users currently see numbers without context: **regional DEXA breakdown, bone density, the body-fat range bar, recent Withings reading rows, AI insight cards, the dashboard headline, and the dashboard summary signal chips**. Also add a small set of glossary entries those surfaces need, plus an optional `evidence` link on each `Insight` so insight cards can carry their own expanded context.

## What changes (user-visible)

1. **DEXA Body Composition card** (Health → Scans)
   - Add a "What this means" disclosure under the **Lean Mass Ratio** progress bar (new glossary key reuses `lean_mass_ratio`).
   - Add a "What this means" disclosure under the **Body Fat % vs healthy range** RangeBar (reuses `body_fat`).
   - Wrap each **Regional Breakdown** tile in a hover/expand affordance using `MetricExplainer` for new keys: `region_arms`, `region_legs`, `region_trunk`, `region_android`, `region_gynoid`. Each entry explains what the region represents (e.g. android = abdominal, strongest cardiometabolic signal) and what to focus on.
   - If `boneDensity` is present, render a small "Bone Density" subsection (T-score / Z-score) with explainer keys `bone_t_score`, `bone_z_score`.

2. **Withings → Recent Readings** (Health → Withings)
   - Add a single shared `MetricExplainer` below the list explaining how to read scale-to-scale deltas (noise band, hydration effect, weekly trend > daily) using a new `weight_trend` key. One disclosure per section, not per row.

3. **Blood Panels**
   - Already covered per-marker via `BloodPanelDetail`. Add a top-of-panel `MetricExplainer` for the "Optimal vs Out of Range" framing using existing `markers_optimal` / `markers_out_of_range` keys, surfaced as one combined "How to read this panel" disclosure on the Blood tab summary strip.

4. **AI Insights cards** (`AIInsightsPanel`, used on all 3 health tabs and dashboard)
   - Each insight already carries `evidence`. Extend `Insight` with optional `metricKey?: MetricKey` and `science?: { what: string; why: string; focus: string[] }`.
   - Render an inline `MetricExplainer` inside each insight card titled "The science" — pulled from the insight's `metricKey` (preferred) or inline `science` block. Keeps cards compact by default, expandable on demand.
   - Update `getBodyScanInsights` and `getBloodPanelInsights` in `src/lib/ai/insights.ts` to populate `metricKey` where the source metric is known (body_fat, lean_mass, fat_mass, and the matched blood marker).

5. **Dashboard — HealthCommandSummary**
   - The "Active Health Signals" chip row gets a single "How to read these signals" disclosure underneath it, explaining the lean/fat/marker thresholds the chips use. New glossary key `health_signals`.
   - The "Headline" insight (if present) also picks up the per-card "The science" disclosure from change #4.

6. **Dashboard — HealthDirectionGrid**
   - Already uses `KpiStat` with `metricKey`, so explainers are present. Add a "Priority Action" small disclosure that explains *why* the priority is what it is, using the headline insight's `metricKey` when available (no new component — reuses `MetricExplainer` with `compact`).

## New / extended glossary entries

Add to `src/lib/health/metric-glossary.ts`:
- `region_arms`, `region_legs`, `region_trunk`, `region_android`, `region_gynoid` — what each DEXA region represents, why android-vs-gynoid ratio matters, suggested focus (training emphasis, posture, cardio for android fat).
- `bone_t_score`, `bone_z_score` — definitions, WHO thresholds (T ≥ −1 normal, −1 to −2.5 osteopenia, ≤ −2.5 osteoporosis), focus (resistance training, vitamin D, calcium, impact loading).
- `weight_trend` — how to interpret day-to-day scale fluctuations (hydration, glycogen, sodium), why weekly trend matters.
- `health_signals` — explains the dashboard chip thresholds (≥ 0.5 lb lean/fat change, marker out-of-range counts).

All copy stays grounded — short, cites typical reference bands, no hyperbole.

## Files touched

| File | Change |
|------|--------|
| `src/lib/health/metric-glossary.ts` | Add new `MetricKey` union members and entries listed above. Extend `resolveMarkerKey` if useful for new blood markers. |
| `src/lib/ai/insights.ts` | Extend `Insight` interface with optional `metricKey` and `science`. Populate `metricKey` in body scan and blood panel insight builders. |
| `src/components/AIInsightsPanel.tsx` | Render `MetricExplainer` ("The science") inside each card when `metricKey` or `science` is present. |
| `src/pages/Health.tsx` | Add explainers to Lean Mass Ratio bar, Body Fat range bar, Regional Breakdown tiles, optional Bone Density subsection, Withings recent-readings footer, and Blood tab summary strip. |
| `src/components/dashboard/HealthCommandSummary.tsx` | Add "How to read these signals" disclosure under the chip row. |
| `src/components/dashboard/HealthDirectionGrid.tsx` | Wrap Priority Action text in `MetricExplainer` driven by the headline insight's `metricKey`. |

## Out of scope (call out for later)

- Charts / sparklines for blood marker trends across panels.
- Per-region radar/heatmap visualization of DEXA regional changes.
- LLM-grounded science copy (we stay deterministic and cite the glossary today).

## APT principles applied

- **Reusable systems over one-offs**: every new explanation goes through `MetricExplainer` + the glossary, no bespoke copy in components.
- **Grounded, no hyperbole**: every disclosure is tied to a glossary entry with a typical range; insights still require evidence.
- **Calm, structured UI**: explanations are collapsed by default — page weight unchanged for users who don't want detail.
- **Dark-first, shared tokens**: no new visual treatments introduced.