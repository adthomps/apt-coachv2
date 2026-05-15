## Goal

The Today page and Admin importers already cover ~95% of the tracking matrix. Two real gaps and a small labeling pass remain.

## Gap 1 — ECG missing from Today's chip grid

Matrix lists "Electrocardiograms (ECG) · By Day · Apple Health · Day Page input." Today, ECG is editable only inside the **Edit all** dialog, so it doesn't show a status chip and a user can't tell it's pending.

**Change:** add an ECG field to `FIELDS` in `src/components/daily/DailyInputsCard.tsx` as `kind: 'select'` mapped to `vitals.ecgRhythm` with options `normal | afib | inconclusive`. Render it as a chip alongside the others. No new types or hooks — `ecgRhythm` already exists on `DailyVitals` and the chip editor's `select` branch already handles select fields.

## Gap 2 — Rythm Health JSON importer

Matrix says "Blood Panel (Rhythm Data) · By Month · Rythm Health · Admin Import Function for **Rhythm JSON**". `src/lib/importers/rythmhealth.ts` currently parses CSV only.

**Change:**
- Add `parseRythmHealthJson(text: string): ImportPreview` to `src/lib/importers/rythmhealth.ts` accepting either a flat marker array or `{ panelDate, markers: [...] }`.
- Export it from `src/lib/importers/index.ts`.
- In `src/pages/Admin.tsx`, detect file extension on the existing Rythm dropzone — `.json` → `parseRythmHealthJson`, `.csv` → `parseRythmHealthCsv`. Update hint text to "CSV or JSON".

## Polish — source labels match device names

Matrix uses precise device names. Current chip "source" labels are close but inconsistent.

**Change in `DailyInputsCard.tsx` field defs:**
- Body fat chip: source `Withings` → `Withings Scale`, label `Body fat` → `Body scan`
- BP chip: source already `BPM Vision` → keep as `Withings BPM Vision`
- Temperature chip: source `BeamO` → `Withings BeamO`
- Weight chip: source `Withings` → `Withings Scale`

These are display-string only — no data model impact.

## Out of scope

- Skulpt Chisel **display** surface (segmental fat/muscle visualization on Health page) — import is already in place; rendering is a separate UX task.
- Real device sync / OAuth — manual entry + JSON/CSV imports remain the entry model.
- Schema or backend changes.

## Files touched

- `src/components/daily/DailyInputsCard.tsx` — add ECG chip, retune source labels
- `src/lib/importers/rythmhealth.ts` — add `parseRythmHealthJson`
- `src/lib/importers/index.ts` — export new parser
- `src/pages/Admin.tsx` — branch on file extension for Rythm uploads, update hint
