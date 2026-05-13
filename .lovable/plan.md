## Goal

Treat DEXA (BodySpec) and Rythm Health as **ground truth** (monthly/quarterly). Treat Withings, Skulpt, Apple Health, Lumen as **daily/check-in context** that overlays — never overrides — the ground-truth values used by nutrition/protocol math.

## Verify pass on existing sources (no behavior change unless broken)

- `src/lib/importers/bodyspec.ts` — kg/lbs auto-convert, regional + bone density still surfaced. Confirm Snapshot is the only writer of body-comp baseline used by `nutrition-targets.ts`.
- `src/lib/importers/rythmhealth.ts` + Apple Health labs importer — confirm both write `BloodPanel` with correct `source` and that `BloodPanelDetail.tsx` shows a source badge.
- Add a small "source of truth" legend to `/health` so the hierarchy is visible.

## New data model (additive, in `src/lib/api/types.ts`)

```ts
export type HealthSourceId =
  | 'bodyspec' | 'rythmhealth'
  | 'withings_scale' | 'withings_bpm' | 'withings_beamo'
  | 'skulpt_chisel' | 'apple_health' | 'lumen';

export type HealthSourceTier = 'truth' | 'context'; // bodyspec/rythm = truth, rest = context

export interface HealthCheckin {
  id: string;
  date: string;            // YYYY-MM-DD
  source: HealthSourceId;
  tier: HealthSourceTier;  // always 'context' for new sources
  // Body composition (Withings Scale, Skulpt)
  weightLbs?: number;
  bodyFatPct?: number;
  leanMassLbs?: number;
  visceralFat?: number;
  waterPct?: number;
  muscleQualityMQ?: number;       // Skulpt Chisel
  regionalMQ?: { region: string; mq: number; bodyFatPct?: number }[];
  // Vitals (Withings BPM / BeamO / Apple Health)
  systolicMmHg?: number;
  diastolicMmHg?: number;
  pulseBpm?: number;
  bodyTempF?: number;
  bloodOxygenPct?: number;
  ecgRhythm?: 'normal' | 'afib' | 'inconclusive';
  stethoscopeNotes?: string;       // BeamO
  // Metabolic (Lumen)
  lumenLevel?: 1 | 2 | 3 | 4 | 5;  // 1 fat-burn → 5 carb-burn
  morningLumenLevel?: 1 | 2 | 3 | 4 | 5;
  metabolicFlexScore?: number;
  rawJson?: string;
  notes?: string;
  createdAt: string;
}

export const HEALTH_SOURCE_META: Record<HealthSourceId, {
  label: string; tier: HealthSourceTier; cadence: 'monthly'|'weekly'|'daily'|'on_demand';
}>;
```

`DailyLog.vitals` (already exists) stays the canonical place for *manually entered* daily vitals on `/today`. `HealthCheckin` is for *device-imported* records that may be many per day and need source attribution for overlays.

## API + hooks

- `src/lib/api/client.ts`: add `healthCheckinApi` (`list({source?, from?, to?})`, `create`, `delete`, `bulkCreate`).
- `src/hooks/use-api-queries.ts`: `useHealthCheckins`, `useCreateHealthCheckin`, `useBulkImportHealthCheckins`.
- Mock data: seed a couple of recent Withings + Lumen entries so the UI isn't empty.

## Importers (`src/lib/importers/`)

| File | Inputs | Output |
|------|--------|--------|
| `withings-scale.ts` | Withings CSV export (`weight.csv`, `body.csv`) | `HealthCheckin[]` (weight, BF%, lean, visceral, water) |
| `withings-bpm.ts` | Withings BP CSV | `HealthCheckin[]` (systolic/diastolic/pulse) |
| `withings-beamo.ts` | Stub: manual-entry form + JSON dropzone | `HealthCheckin[]` (temp, SpO2, ECG, steth notes) — marked **beta** until sample provided |
| `skulpt-chisel.ts` | Skulpt JSON/CSV (manual paste — app is discontinued, no API) | `HealthCheckin` with `regionalMQ[]` |
| `lumen.ts` | Stub matching documented Lumen export shape | `HealthCheckin[]` with morning + daily Lumen level — marked **beta** until sample provided |
| `applehealth-vitals.ts` | Apple Health export.zip → already-extracted JSON of HKQuantityTypeIdentifier records | `HealthCheckin[]` for SpO2/BP/temp/RHR/steps |

All return the existing `ImporterResult<T>` shape; surface unknown rows as warnings.

## UI

- **`/health` (Health hub, refactor)**: top section = "Ground truth" (DEXA card + Rythm card with last-scan dates and CTA). Below = "Daily context" grid: one card per source with last sync, latest values, sparkline, "Import" button. Legend explains overlay rule.
- **DEXA detail / `Snapshot` view**: add overlay toggles ("Show Withings", "Show Skulpt") that draw lighter lines on the body-comp trend chart. Overlays are read-only annotations.
- **Blood panel detail**: add overlay rail of recent BPM + BeamO vitals around the panel date for context.
- **`/today`** (existing `DailyVitalsPanel`): add a small "Imported today from Withings / Apple Health / Lumen" chip set so manual entry doesn't double-up.
- **Admin tab**: new "Daily devices" section grouping importers for the new sources, with a per-source dropzone/textarea and a preview table before commit.

## Files

**Created**
- `src/lib/importers/withings-scale.ts`
- `src/lib/importers/withings-bpm.ts`
- `src/lib/importers/withings-beamo.ts` (beta)
- `src/lib/importers/skulpt-chisel.ts`
- `src/lib/importers/lumen.ts` (beta)
- `src/lib/importers/applehealth-vitals.ts`
- `src/components/health/HealthSourceCard.tsx`
- `src/components/health/SourceOverlayToggle.tsx`
- `src/components/health/GroundTruthLegend.tsx`

**Edited**
- `src/lib/api/types.ts`, `src/lib/api/client.ts`, `src/lib/api/mock-data.ts`, `src/lib/api/index.ts`
- `src/lib/importers/index.ts`
- `src/hooks/use-api-queries.ts`
- `src/pages/Health.tsx`, `src/pages/Admin.tsx`
- `src/components/BloodPanelDetail.tsx`
- `src/components/daily/DailyVitalsPanel.tsx`
- `.lovable/memory/index.md` (add HealthCheckin + source tiers)

## Out of scope (this pass)

- Real OAuth to Withings / Apple Health / Lumen APIs (would need Lovable Cloud + per-user OAuth). All importers stay file/paste-based.
- BeamO + Lumen parsers will land as stubs with a TODO until you upload sample exports — they'll still accept manual entry today.
- No changes to nutrition math: only DEXA-derived `BodyComposition` continues to feed `nutrition-targets.ts`.

## Open question (won't block — sane defaults applied)

- For Withings Scale CSV, Withings exports use kg by default. I'll auto-convert and warn, same pattern as `bodyspec.ts`.