# Health Data — Source-Tabbed Redesign

Restructure `/health` to match the mock: a **single source-selector tab strip** at the top, a **scan/reading meta line** with comparison + AI insight buttons, a **4-up KPI hero strip** with delta + Fav/Unfav chips, a **two-column detail panel** (composition detail + regional/marker breakdown), and a **bone-density / supplemental tile row**. Each source view can layer in **overlays** from related sources for context.

## Source tabs

A single horizontal pill bar (chip-style like the mock) replaces the current 3-tab `Tabs` strip. Tabs:

```text
[ ⚡ DEXA ]  [ 🧪 Rythm Health ]  [ ❤ Apple / MyChart ]  [ ⚖ Withings ]  [ ✏ Skulpt Chisel ]  [ 💨 Lumen ]
```

Withings expands into a sub-segment row beneath the tabs:

```text
Scale / Body Scan   ·   BPM Vision   ·   BeamO
```

## Per-source layout (shared shell)

```text
─────────────────────────────────────────────────────────
SCAN/READING: <date> · <provider> · COMPARING vs <date> (<n> DAYS)
[ Comparison window ▾ ]   [ ✦ AI insights ]
─────────────────────────────────────────────────────────
┌ KPI 1 ┐ ┌ KPI 2 ┐ ┌ KPI 3 ┐ ┌ KPI 4 ┐    ← delta arrow + Fav/Unfav chip
└───────┘ └───────┘ └───────┘ └───────┘
┌────────────── DETAIL PANEL (2-col) ──────────────────┐
│ Left: composition / marker detail                     │
│ Right: regional / supporting metrics + overlay chips  │
└───────────────────────────────────────────────────────┘
┌ Tile 1 ┐ ┌ Tile 2 ┐ ┌ Tile 3 ┐ ┌ Tile 4 ┐   ← bone density / vitals / lumen flex
└────────┘ └────────┘ └────────┘ └────────┘
[ ⓘ What these scores mean ]
```

## Source-by-source content

**DEXA (BodySpec)** — keeps current data. KPIs: Weight, Body Fat %, Lean, Fat. Detail: lean ratio, BF vs healthy range, visceral fat, fat:lean ratio, android:gynoid, bone mass. Right column: regional breakdown (android/arms/gynoid/legs/trunk) with delta + Fav/Unfav. Bottom row: T-score, Z-score, Lumbar BMD, Femur BMD. **Overlay:** chips above KPIs showing nearest-date Withings weight/BF and Skulpt MQ as "context reading vs scan" deltas.

**Rythm Health (Blood Panel)** — KPIs: # markers, # flagged, # optimal, panel score. Detail (left): grouped marker table by category (lipids / metabolic / hormones / inflammation) reusing `BloodPanelDetail`. Right: trend mini-cards for top-3 changed markers vs prior panel. Bottom row: top flagged marker explainers. No overlays.

**Apple / MyChart** — KPIs: Resting HR, HRV, VO₂max, Sleep avg. Detail: 7/30/90-day trend chart for the selected metric (uses `applehealth-vitals` checkins). Right: workout summary + step/active energy averages. Bottom row: hand-grip, walking steadiness, audio exposure. No overlays (it's already the aggregator).

**Withings — Scale / Body Scan** — KPIs: Weight, Body Fat %, Muscle Mass, Water %. Detail left: weight trend over comparison window, segmental composition. Right: "Variance vs DEXA" overlay (ground-truth delta) + "Variance vs Skulpt MQ regions". Bottom: bone mass, visceral fat, BMI, pulse-wave velocity.

**Withings — BPM Vision** — KPIs: Systolic, Diastolic, Pulse, MAP. Detail: BP trend, AM/PM split, classification banner (normal/elevated/stage1/stage2). Right: medication-window notes from notes field. Bottom: weekly avg, # readings, time-in-target %.

**Withings — BeamO** — KPIs: Temp, SpO₂, ECG rhythm, Stethoscope notes. Detail: per-modality recent readings list. Right: rhythm log timeline. Bottom: overlay Apple Health vitals for the same date (HR, HRV).

**Skulpt Chisel** — KPIs: Overall MQ, Body Fat %, Best region MQ, Weakest region MQ. Detail left: regional MQ + BF table with sparkline vs prior reading. Right: **overlay** Withings BF % and DEXA regional lean for nearest dates as a side-by-side compare. Bottom: per-muscle-group strength-direction notes.

**Lumen** — KPIs: Morning level, Daily peak, Metabolic flex score, Streak days. Detail left: per-day morning→peak swing chart over comparison window with pre/post-meal markers (breakfast/lunch/dinner — leverages the recently added Lumen events model). Right: macro guidance derived from level (carb-fat balance hints). Bottom: weekly flex avg, fasted-AM %, post-workout drop %.

## Comparison window

Replace the bare `Compare against ▾` selector with a **dropdown popover** (button labelled `Comparison window ▾`) offering:
- Previous reading (auto)
- Pick a date (existing list)
- Last 7 / 30 / 90 days rolling avg

Same component reused across every source. For sources without paired readings (Apple Health), the dropdown switches to "Trend window" with 7/30/90/180 day options.

## Overlay model

Each source declares optional `companionSources: HealthSourceId[]`. The shell renders an **Overlay strip** above the KPI hero with one chip per companion, e.g. `Withings · 205.4 lbs (Feb 26) · −0.8 lbs vs scan`. Click → opens that source's tab pre-filtered to the matched date.

## Components to add / change

**New**
- `src/components/health/HealthSourceTabs.tsx` — pill-style top tabs + Withings sub-segments.
- `src/components/health/SourcePageShell.tsx` — meta row, comparison popover, AI insights button, KPI strip slot, detail-panel slot, tile-row slot.
- `src/components/health/KpiHeroTile.tsx` — large KPI variant with `Fav` / `Unfav` chip (matches mock).
- `src/components/health/CompositionDetailPanel.tsx` — left/right two-col detail with metric explainer rows and the regional list on the right.
- `src/components/health/ComparisonWindowPopover.tsx` — replaces inline compare select.
- `src/components/health/CompanionOverlayStrip.tsx` — chip row pulling from sibling sources by nearest date.
- `src/components/health/views/` — one view per source: `DexaView.tsx`, `RythmBloodView.tsx`, `AppleHealthView.tsx`, `WithingsScaleView.tsx`, `WithingsBpmView.tsx`, `WithingsBeamoView.tsx`, `SkulptView.tsx`, `LumenView.tsx`.

**Updated**
- `src/pages/Health.tsx` — becomes a thin router: tab state → renders one of the source views inside `SourcePageShell`. Keep existing data hooks (`useSnapshots`, `useBloodPanels`, `useHealthCheckins`).
- `src/components/health/KpiStat.tsx` — extend with optional `favTone: 'fav' | 'unfav'` chip used by the hero variant.

**Removed**
- The current `Tabs`/`TabsList` markup in `Health.tsx` (folded into `HealthSourceTabs`).

## Data sources reused (no API changes)

- `useSnapshots()` → DEXA + Withings Scale (filtered by provider).
- `useBloodPanels()` → Rythm Health.
- `useHealthCheckins({ source })` → Withings BPM, BeamO, Apple Health, Lumen, Skulpt Chisel (already populated by existing importers).
- `getBodyScanInsights` / `getBloodPanelInsights` reused; add thin `getVitalsInsights` later if needed (not in this pass).

## Out of scope (this pass)

- New importer schemas — all existing.
- Editing scan/panel records — still via Admin.
- Charts library swap — uses existing recharts wrappers.
- Mobile-specific redesign — desktop-first, responsive collapse only.
