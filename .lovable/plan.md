## Goal

Bring Apple Health–style data into APT in three coordinated places, each chosen to match how the data is naturally produced:

1. **Workout sessions** → expand `SessionMetrics` (cardio + HR detail).
2. **Daily vitals** → new daily-keyed record edited inline on `/today` and bulk-importable.
3. **Lab results** → Apple Health PDF/JSON importer that lands in the same `BloodPanel` store as RythmHealth so they can be compared side-by-side.

No backend changes — extends the mock API layer and types; everything is local-first per existing patterns.

---

## 1. Session metrics (edit on existing Sessions tab)

Already partially in place (`activeCalories`, `totalCalories`, `avgHeartRate`, `rpe`). Add cardio fields and a kind flag.

**Where**: `src/components/SessionsTab.tsx` edit dialog + `src/pages/SessionDetail.tsx`. No new page — Apple Health workout data is most naturally tied to a session.

**Type changes** (`src/lib/api/types.ts`):
```ts
export type SessionKind = 'strength' | 'cardio' | 'mixed';

export interface SessionMetrics {
  activeCalories?: number;
  totalCalories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;       // new
  rpe?: number;
  // cardio-only
  distanceMiles?: number;       // new
  avgPaceSecPerMile?: number;   // new (stored numeric, rendered mm:ss)
  elevationGainFt?: number;     // new (optional bonus)
}

// WorkoutSession gets:
kind?: SessionKind;             // defaults 'strength'
```

**UI**:
- Edit dialog gains a "Session kind" toggle. When `cardio` or `mixed`, reveal Distance + Avg pace inputs.
- Session card body shows pace + distance pills when present.
- `SessionDetail` summary row mirrors the same fields.

---

## 2. Daily vitals (new section on `/today`)

These are once-per-day point readings, not session-bound, so they belong on the daily log.

**Type changes**:
```ts
export interface DailyVitals {
  bloodOxygenPct?: number;          // SpO2
  systolicMmHg?: number;
  diastolicMmHg?: number;
  bodyTempF?: number;
  respiratoryRateBrpm?: number;
  sleepScore?: number;              // 0–100
  sleepHours?: number;
  stepsCount?: number;
  waistCircumferenceIn?: number;
  restingHeartRate?: number;
  notes?: string;
}

// DailyLog gets:
vitals?: DailyVitals;
```

**API** (`src/lib/api/client.ts`): extend `dailyLogApi` with `updateVitals(date, vitals)` that merges into the day's log.

**Hook**: `useUpdateDailyVitals()` mirroring `useLogWeight`.

**UI** — new component `src/components/daily/DailyVitalsPanel.tsx`:
- Collapsible card placed on `/today` between the Meals section and `DailyTrainingCard`.
- Compact grid of inline numeric inputs grouped:
  - **Cardiovascular**: Resting HR, BP (systolic/diastolic), Blood Oxygen
  - **Recovery**: Sleep score, Sleep hours, Respiratory rate, Body temp
  - **Activity**: Steps
  - **Body**: Waist circumference (also fed into trend display next to morning weight)
- Empty fields render a subtle "—" placeholder; saving on blur, same UX as the morning weight input.
- Today header: small "Vitals: 3/9 logged" hint chip linking to the panel.

**Why on /today and not Sessions**: SpO2, BP, sleep, steps, etc. are not workout-bound and are entered/imported daily.

---

## 3. Apple Health labs import (PDF + JSON)

Apple Health Records can export lab results as PDF (provider summary) or as Health export `export.xml` / FHIR JSON. We support both via a new importer that produces a `BloodPanel` with `source: 'apple_health'`, so RythmHealth and Apple Health labs live in the same comparison view.

**Type changes**:
```ts
export type BloodPanelSource = 'rythmhealth' | 'apple_health';
// BloodPanel.source widens to BloodPanelSource
// add optional rawPdfText?: string and rawJson?: string alongside rawCsv
```

**New importer** `src/lib/importers/applehealth-labs.ts`:
- `parseAppleHealthLabsJson(text)` — accepts FHIR `Observation` bundle or Apple Health export JSON; maps LOINC codes / display names to our marker names; computes `status` from referenceRange when available, otherwise `'average'`.
- `parseAppleHealthLabsPdf(file)` — runs the PDF through a lightweight client-side text extractor (`pdfjs-dist`, already a viable browser dep) and a regex pass that finds rows of `marker  value  unit  reference`. Returns the same normalized result with warnings for any rows it could not parse.
- Exported via `src/lib/importers/index.ts` next to existing parsers.

**Admin Imports tab** (`src/pages/Admin.tsx`):
- Add source `apple_health_labs` with label "Apple Health Labs (PDF or JSON)".
- For PDF: swap the textarea for a file dropzone when this source is selected; for JSON: keep the textarea.
- On import, save via `bloodPanelApi.create({ source: 'apple_health', ... })` and run `analyzeBloodPanel`.

**Comparison**:
- `BloodPanelDetail` and Health page already iterate on markers; just label the source badge so users can see "Apple Health" vs "Rythm" side by side.
- No new compare UI in this pass — mixing sources by date already works because both share the marker schema. (Follow-up: same-marker overlay chart.)

**Optional Apple Health bulk vitals import**: same Admin tab also accepts an Apple Health export for vitals (SpO2, BP, steps, sleep, RR, body temp, waist). This populates `DailyLog.vitals` for the days present. Implemented as a second source `apple_health_vitals` so labs and vitals stay separate.

---

## File touch-list

**New**
- `src/components/daily/DailyVitalsPanel.tsx`
- `src/lib/importers/applehealth-labs.ts`
- `src/lib/importers/applehealth-vitals.ts` (optional bulk vitals)

**Edited**
- `src/lib/api/types.ts` — `SessionMetrics`, `WorkoutSession.kind`, `DailyVitals`, `DailyLog.vitals`, `BloodPanelSource`
- `src/lib/api/client.ts` — `dailyLogApi.updateVitals`, `bloodPanelApi.create` accepts `apple_health` source
- `src/lib/api/index.ts` — re-exports
- `src/lib/importers/index.ts` — exports
- `src/hooks/use-api-queries.ts` — `useUpdateDailyVitals`
- `src/components/SessionsTab.tsx` — kind toggle + cardio fields in edit dialog and card pills
- `src/pages/SessionDetail.tsx` — show cardio metrics
- `src/pages/Today.tsx` — mount `DailyVitalsPanel`
- `src/pages/Admin.tsx` — `apple_health_labs` (+ optional `apple_health_vitals`) sources, file input branch
- `src/components/BloodPanelDetail.tsx` — render source badge

**Dependency**: `pdfjs-dist` for client-side PDF text extraction (only loaded on the Admin Imports tab).

---

## Open question (1)

Apple Health PDF lab exports vary per provider. For this pass I default to a generic regex that recognizes the common `Marker  Value  Unit  Range` pattern and surfaces unparsed lines as warnings the user can paste into the JSON path instead. If you want provider-specific parsers (Quest, LabCorp, Apple Health Records native PDF), name them and I'll add tailored extractors.
