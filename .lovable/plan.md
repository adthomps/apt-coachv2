## Goal

Apply [APT principles](https://github.com/adthomps/apt-principles) (Accurate, Practical, Trustworthy — clarity, source attribution, low cognitive load, progressive disclosure) to the health UI, and reorganize inputs to match the tracking matrix you provided. No new business logic — pure UI/IA + lightweight form fields routed to existing APIs.

## Tracking matrix → UI placement

| Surface | What lives there | Cadence |
|---|---|---|
| **Today (`/today`)** — Day Page | Apple Health daily: steps, glucose, SpO2, ECG (rhythm chip), respiratory rate, sleep score, water intake. Lumen score. Withings Scale (weight, body scan). Withings BeamO (body temp). Withings BPM (BP). | Daily |
| **Sessions (`/sessions/:id`)** | Apple Fitness per-session: active cal, total cal, avg HR, HR zones 1–5, exercise effort/RPE, start/end time. Already partially there — surface zones + effort. | Per session |
| **Admin → Imports** | JSON imports: Apple Health (blood panel + vitals export), Dexa/BodySpec, Rythm Health, Skulpt Chisel (regional fat/muscle L/R arms+legs+torso). | Monthly / yearly |
| **Health hub (`/health`)** | Read-only overview: ground truth (DEXA, Rythm) on top, context sources below with sparklines. | Always |

## APT-style UI changes

1. **Today page restructure** — replace the flat `DailyVitalsPanel` with a tabbed/segmented "Daily Signals" card:
   - Tabs: **Apple Health** · **Withings** · **Lumen**
   - Each tab shows compact field rows grouped by source so attribution is obvious. Source badge + "last imported X ago" per group.
   - ECG = 3-state chip (Normal / AFib / Inconclusive). Sleep score = 0–100 with color band. Glucose = mg/dL numeric.
   - Add `bloodGlucoseMgDl` and `waterIntakeOz` to `DailyVitals` type (additive).

2. **Sessions detail enhancement** — extend `SessionMetrics` with `hrZoneSecs?: [z1,z2,z3,z4,z5]` and surface a stacked HR-zone bar + per-exercise effort column in `SessionDetail.tsx`. Keep existing fields.

3. **Admin → Imports reorg** — group importers into 3 sections with consistent card pattern:
   - **Ground truth (monthly/yearly):** BodySpec DEXA, Rythm Health, Apple Health Labs (MyChart JSON).
   - **Body composition context:** Skulpt Chisel (with per-region preview table: L/R arms, L/R legs, torso fat & muscle).
   - **Vitals context:** Withings Scale, Withings BPM, Withings BeamO, Apple Health Vitals, Lumen.
   - Each card uses same shell: title, source badge, cadence chip, dropzone/textarea, preview, commit.

4. **Health hub polish** — add the "Ground truth vs context" legend at top (already built `GroundTruthLegend.tsx`), make ground-truth cards visually heavier (border + accent), context cards lighter. Sparklines use muted strokes.

5. **APT visual consistency**:
   - Single H1 per page; section cards via existing `SectionCard`.
   - Source badge component (`<SourceBadge source="apple_health" />`) reused across Today, Sessions, Admin, Health.
   - All numbers right-aligned in tables, units in muted-foreground, deltas via existing `DeltaValue`.
   - Empty states use `EmptyState` with a clear next action ("Import from Admin →").

## Files

**Created**
- `src/components/health/SourceBadge.tsx` — unified source chip
- `src/components/daily/DailySignalsTabs.tsx` — tabbed Today panel (replaces inline grid in `DailyVitalsPanel`)
- `src/components/sessions/HeartRateZoneBar.tsx`

**Edited**
- `src/lib/api/types.ts` — add `bloodGlucoseMgDl`, `waterIntakeOz` to `DailyVitals`; add `hrZoneSecs` to `SessionMetrics`
- `src/components/daily/DailyVitalsPanel.tsx` — render `DailySignalsTabs`
- `src/pages/Today.tsx` — pass source-attributed data
- `src/pages/SessionDetail.tsx` — HR zone bar + effort column
- `src/pages/Admin.tsx` — regroup importer sections (Ground truth / Body comp / Vitals)
- `src/pages/Health.tsx` — apply ground-truth visual hierarchy
- `.lovable/plan.md` — replace prior plan

**Out of scope:** OAuth to any vendor, real-time sync, changes to nutrition/protocol math, new DB schemas (mock layer only). BeamO + Lumen parsers stay beta until you upload samples.

Approve and I'll implement.
