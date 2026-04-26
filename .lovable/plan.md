# APT Coach — Command Center, Health Depth & Chrome

Scope is large, so I'll break it into 4 phases. Approve and I'll execute Phase 1 first, then continue.

---

## Phase 1 — App chrome (footer + user menu) and small Training/Sessions ergonomics

**Layout / chrome (`src/components/Layout.tsx`)**
- Add a sticky **footer** with: `© {year} APT Coach`, version chip, "Admin" link (admin role only), "User Guide" link, "Imports" link (moves out of Admin header).
- Replace the standalone `Settings` icon + `LogOut` button in header with a **user dropdown** (shadcn `dropdown-menu`):
  - Header shows user name + email
  - Items: **Profile**, **Settings**, **User Guide**, divider, **Sign out**
  - Mobile sheet gets the same grouped block at the bottom
- Move "Import Health Data" entry point from Admin header to footer link `/admin?tab=imports` (Admin keeps it, but footer becomes the discoverable home).

**Training → Sessions tab (`src/components/SessionsTab.tsx`, `src/pages/Training.tsx`)**
- Add a primary **"New Session"** button in the Sessions tab toolbar (matches Exercises/Workouts/Programs pattern). Opens FormDialog to pick a workout + start date/time → creates an `in_progress` session and navigates to `/workouts/:id/start?resume=…`.
- Keep existing edit dialog for retroactive session entry.

---

## Phase 2 — Dashboard Command Center redesign

Rebuild `src/pages/Dashboard.tsx` into 3 stacked sections aligned to your wording. All deterministic; reuses existing `getBodyScanInsights`, `getBloodPanelInsights`, and `protocol.ts`.

### 2a. Health Command Summary (new section)
Top band — a compact summary card with three columns:
- **Active Health Signals** — chips for "What changed" (last DEXA delta), "What to keep doing", "Current inputs" (latest scan date, latest panel date, latest Withings date).
- **Priority Direction** — top 1–2 protocol recommendations (from `protocol.ts`) rendered as a directive ("Lean into hypertrophy", "Cap deficit at …").
- **Training Continuity** — adherence %, current streak, next session day-of-week.

### 2b. Health Direction (Dexa · Rythm · Withings)
Three-up grid of provider cards, each with:
- Status pill (Optimal / Watch / Concern) derived from existing insight categories
- 1–2 top **Signals** ("ApoB out of range")
- **Priority Action** (from protocol)
- **Food Guidance** snippet (from `protocol.ts` `FoodSuggestion`)
- "Open Health" link

### 2c. Training section
- **Training Pulse** — small sparkline-style strip: sessions completed in last 14d, total volume trend.
- **Adherence** card (existing logic).
- **Upcoming** — next 3 scheduled sessions with quick Start.
- **Latest Completed Session** — performance snapshot (volume, completion %, RPE, duration) with link to `SessionDetail`.
- **Training Insights** — reuses `session-insights.ts` rules; renders top 2 across last 5 sessions.

### 2d. Today's Headlines + Supporting Insights
- Keep "Today's Headline Insight" in its current position (band 1 above the new sections, or as the lead inside Health Command Summary — I'll put it as a thin lead inside Health Command Summary to avoid duplicate cards).
- Move "Supporting Insights" into a collapsible **"More insights"** section at the bottom (so it doesn't dominate). If signal volume gets high we add a dedicated `/insights` tab — flagged as a future task, not built now.

Body composition data is woven into Health Command Summary (chips) and the Dexa card in Health Direction — not a separate band.

---

## Phase 3 — Health Data depth (DEXA + Rythm enhancements)

`src/pages/Health.tsx`, plus new presentational components.

### 3a. Shared "Metric Guide" primitive
- New `src/components/health/MetricGuide.tsx` — accordion item: title, 1-line meaning, "Why it matters", "Coaching suggestions" bullets. Pure-content driven.
- New `src/lib/health/metric-copy.ts` — versioned static copy keyed by metric id (Weight, Body Fat, Lean Mass, Fat Mass, Lean Mass Ratio, Visceral Fat Area, Region/Arms/Legs/Trunk, T-Score, Z-Score, Lumbar, Femur, plus blood markers). Single source of truth, easy to edit.

### 3b. DEXA tab — Overview / Body Composition / Bone Density sub-tabs
Within the selected DEXA scan detail, replace the single-column layout with `Tabs`:
- **Overview** — current KPI grid + Metric Guide accordion (Weight, Body Fat, Lean Mass, Fat Mass).
- **Body Composition**
  - Lean Mass % and Fat Mass % rings/bars (existing).
  - **Body Region Load bars** — new horizontal stacked bars showing each region's share of (fat + lean) so you can see relative load. Reads from `regionalData`.
  - **Compare bars** — new component `<CompareBars>` showing Current vs. Prior for Weight / Body Fat / Lean Mass / Fat Mass driven by the existing `comparison` object and selectable prior scan (compare-window selector added above the detail).
  - Metric Guide for Lean Mass Ratio + Visceral Fat Area.
- **Bone Density**
  - Reads `regionalData`/scan extras for T-Score, Z-Score, Lumbar, Femur (we'll extend `Snapshot` schema with optional `boneDensity?: { tScore, zScore, lumbar, femur }` and seed mock data; importer keeps it optional).
  - Metric Guide for each.

A **Compare Window** selector (Latest vs Previous · vs Baseline · vs custom) sits above the sub-tabs and feeds both the KPI deltas and the new compare bars.

### 3c. Rythm Health Panels — Blood Signal Summary + sub-tabs
Within the selected panel:
- **Blood Signal Summary** band (new) — counts: Out of Range, Improved, Worsened, Unchanged + 3 mini-trends (Out-of-Range trend, Optimal Marker trend, Delta Magnitude) computed from previous panel comparison.
- **Top Changes** — new `<MarkerCompareBars>` for Total Testosterone, Triglycerides, Total Cholesterol (configurable list).
- **Panel Overview** — Optimal/Average/Out-of-Range counts out of total; Compare Window selector.
- **Markers** sub-tab — filter chips (All / Out of Range / Average / Optimal); each marker is a collapsible row with reference range, status, why-it-matters and suggestions (driven by `metric-copy.ts`).
- **Marker Changes** sub-tab — paired diff view with tags (Improved, Worsened, Still Out of Range, Unchanged).
- **Insights** sub-tab — current `getBloodPanelInsights` output rendered with Source / Reasoning / Action / Tag (concern, watch, keep). Each opens to a detail panel.

### 3d. Withings tab expansion
Restructure into device sub-sections (placeholder cards for devices without data; only "Body Scan" populated from existing data):
- **Body Scan / Scale** — date + age of reading, KPIs (Weight, Body Fat, Fat Mass, Lean Mass, Muscle, Visceral Fat). Muscle + Visceral added as optional fields on snapshot for Withings provider; mock data seeded.
- **BPM (Blood Pressure)** — empty-state card with "Coming soon — log a reading" button (placeholder, no data model yet — flagged as future).
- **BeamO (Temp)** — empty-state card (placeholder).
- **U-Scan** — empty-state card (placeholder).

Empty-state placeholders use the existing `EmptyState` component so the UI is honest about what's wired vs planned.

---

## Phase 4 — Imports relocation + cleanup

- Admin keeps the imports tab but is no longer the marketed entry point.
- Footer "Imports" link → `/admin?tab=imports` (and we can later split imports into its own route `/imports` if you prefer; not in this phase).
- Health page header "Import in Admin" button replaced with a smaller link in each tab's empty-state only.

---

## Files (created / edited)

**New**
- `src/components/Footer.tsx`
- `src/components/UserMenu.tsx`
- `src/components/health/MetricGuide.tsx`
- `src/components/health/CompareBars.tsx`
- `src/components/health/RegionLoadBars.tsx`
- `src/components/health/BoneDensityPanel.tsx`
- `src/components/health/BloodSignalSummary.tsx`
- `src/components/health/MarkerCompareBars.tsx`
- `src/components/dashboard/HealthCommandSummary.tsx`
- `src/components/dashboard/HealthDirectionGrid.tsx`
- `src/components/dashboard/TrainingPulse.tsx`
- `src/lib/health/metric-copy.ts`

**Edited**
- `src/components/Layout.tsx` (footer + user menu + remove standalone Settings/Logout)
- `src/pages/Dashboard.tsx` (Command Center rebuild)
- `src/pages/Health.tsx` (sub-tabs, compare-window selector, integrate new components)
- `src/components/BloodPanelDetail.tsx` (sub-tab structure + filter chips + collapsible markers)
- `src/components/SessionsTab.tsx` + `src/pages/Training.tsx` (New Session CTA)
- `src/lib/api/types.ts` (optional `boneDensity`, optional muscle/visceral on bodyComposition)
- `src/lib/api/mock-data.ts` (seed bone density + Withings muscle/visceral)
- `src/pages/Admin.tsx` (no header changes — imports link comes from footer)

---

## Out of scope / flagged future
- Real device APIs (Apple Health, Withings cloud, Rythm) — manual entry only stays.
- Splitting Insights into its own top-level page — only added if dashboard density gets too high after Phase 2.
- BPM / BeamO / U-Scan data models — UI placeholders only this round.

---

## Validation
- Type-check after each phase (`tsc`).
- Manual walk-through: Dashboard (with and without data), Health → all 3 tabs and sub-tabs, Compare window switching, Sessions "New Session" flow, Footer links + User dropdown on desktop and mobile.
- Confirm no regression on existing `getBodyScanInsights` / `getBloodPanelInsights` / `protocol.ts` outputs (reused, not rewritten).

Approve and I'll start with Phase 1 (chrome) immediately, then continue Phase 2 → 3 → 4 in subsequent turns.