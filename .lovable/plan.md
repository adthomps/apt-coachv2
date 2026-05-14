# Today Page Redesign

Re-layout `/today` into a two-column dashboard matching the uploaded mock. Frontend-only — no API or business-logic changes. Uses existing data hooks; signals/cards derive from data already in state.

## Layout

Desktop (≥lg): two columns, left = inputs/meals, right = context/calendar/signals.
Tablet/mobile: single column, ordered as below.

```
┌──────────────────────────────────────────────────────────┐
│ TodayHeader: "Thursday, May 14"                          │
│ subline: "3 of 8 inputs logged · 5 pending · AI 07:42"   │
│ actions: ‹ Prev · Today · Next › · Refresh AI            │
├──────────────────────────────────────────────────────────┤
│ AI Direction Banner (one paragraph, refreshable)         │
├───────────────────────────────┬──────────────────────────┤
│ Daily Inputs card             │ Mini calendar (month)    │
│  - status chips (logged/pending) - dot per logged day   │
│  - "click any to edit"        │  - "View / back fill"    │
│  - 4 KPI tiles row            │                          │
├───────────────────────────────┼──────────────────────────┤
│ Nutrition Goals card          │ Year/Month Signals       │
│  - macros + bars              │  - DEXA / Rythm / Apple  │
├───────────────────────────────┼──────────────────────────┤
│ Meals (B/L/D/Snacks)          │ Changes To Work On Today │
│                               │  - Nutrition / Training  │
│                               │  - Week direction        │
└───────────────────────────────┴──────────────────────────┘
```

## New components (presentation only)

- `TodayHeader.tsx` — title, status line, prev/today/next + Refresh AI buttons.
- `AIDirectionBanner.tsx` — single accent-bordered card; copy from `protocol.ts` recommendation; "last refreshed" timestamp.
- `DailyInputsCard.tsx` — replaces current `DailySignalsTabs` UX.
  - Status chip row: each tracked field shown as a pill — green check if `vitals[key]` set, amber clock if not (e.g. "Weight · 204.7 lbs", "Temperature · pending").
  - Click chip → inline popover/sheet to edit just that field (reuses existing mutation hooks).
  - Bottom row: 4 KPI tiles for the headline numbers (Weight, Body Fat, BP, Steps) using existing `KpiStat`.
- `MiniMonthCalendar.tsx` — month grid; dot per day where `dailyLog` exists; current day highlighted; legend "Complete / Partial"; CTA "View / back fill past days" linking to a date picker (route param `?date=`).
- `YearMonthSignalsCard.tsx` — list of ground-truth signals grouped by source with status badge (Act/Watch/Good). Pulls from latest snapshot, blood panel, DEXA compare deltas.
- `ChangesTodayCard.tsx` — three stacked notes (Nutrition / Training / Week direction), generated from existing nutrition gap math + schedule + adaptive engine output.

## Edits

- `src/pages/Today.tsx` — recompose into the grid above; wire date param for prev/next/back-fill; keep nutrition/meals logic intact.
- `src/components/daily/DailyVitalsPanel.tsx` — repurpose as `DailyInputsCard` host (or replace import).
- `src/components/daily/DailySignals.tsx` — extend to feed `ChangesTodayCard` (split into nutrition / training / week buckets).
- `src/components/daily/NutritionTargetsPanel.tsx` — minor: add "Why this matters" trigger inline with goal/activity chips per mock.

## Interactions

- Status chip click → field-level edit popover (no full-form modal).
- Prev/Next day buttons update `?date=YYYY-MM-DD`; default = today.
- Refresh AI → re-runs protocol recommendation, updates timestamp.
- Calendar day click → navigates to `/today?date=...`.

## Out of scope

- New backend fields, real device sync, schema changes.
- Adaptive engine logic changes (only consume existing outputs).
- Session detail / Admin / Health pages.

## Acceptance

- `/today` matches mock structure on desktop and stacks cleanly on mobile.
- Each daily input shows logged/pending state and is editable in one click.
- Date navigation + back-fill calendar work via URL param.
- AI banner + changes panel render from existing protocol/nutrition data.
- Type-checks pass; no business-logic regressions.
