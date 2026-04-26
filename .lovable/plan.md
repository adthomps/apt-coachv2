

# Blood Marker Snapshots — RythmHealth Integration

## Overview

Extend the snapshot system to support two distinct data sources: **BodySpec** (body composition scans) and **RythmHealth** (blood marker panels). Each source gets its own import flow, display, and adaptive engine rules. The Snapshots page becomes a unified health data hub with tabs per source type.

## Domain Model Changes

### New Types (`src/lib/api/types.ts`)

```text
BloodMarkerStatus = 'optimal' | 'average' | 'outOfRange'

BloodMarker {
  marker: string           // "Free T3", "ApoB", etc.
  value: number
  unit: string             // "pg/mL", "mg/dL", etc.
  referenceRange: string   // "2 - 4.4"
  referenceMin: number
  referenceMax: number
  status: BloodMarkerStatus
  time: string             // ISO date
}

BloodPanel {
  id: string
  source: 'rythmhealth'
  panelDate: string
  markers: BloodMarker[]
  rawCsv?: string
  notes?: string
  createdAt: string
}
```

Add `source` field to existing `Snapshot` type (default `'bodyspec'`) for consistency.

### Marker Categories (for grouped display)

| Category | Markers |
|----------|---------|
| Hormones | Free T3, TSH, Total Testosterone, Free Testosterone, Estrogen, SHBG |
| Lipids | Total Cholesterol, HDL, LDL, Triglycerides, ApoB, Remnant Cholesterol + ratios |
| Metabolic | Creatinine, Albumin, Ferritin, hs-CRP, Vitamin D |

## New Files

| File | Purpose |
|------|---------|
| `src/lib/api/types.ts` | Add `BloodMarker`, `BloodPanel`, `BloodMarkerStatus` types |
| `src/components/BloodPanelImportDialog.tsx` | CSV paste/parse dialog for RythmHealth data |
| `src/components/BloodPanelDetail.tsx` | Marker display with status badges, category grouping, out-of-range highlights |
| `src/lib/blood-marker-engine.ts` | Deterministic rules that produce `AdaptiveRecommendation[]` from blood markers |
| `src/lib/validations.ts` | Add `bloodPanelImportSchema` |

## Modified Files

| File | Changes |
|------|---------|
| `src/lib/api/types.ts` | Add blood panel types, add `'blood_marker_insight'` to `AdaptiveRecommendationType` |
| `src/lib/api/client.ts` | Add `bloodPanelApi` with CRUD + mock data |
| `src/lib/api/mock-data.ts` | Add `mockBloodPanels` seeded with the example data provided |
| `src/lib/api/index.ts` | Export `bloodPanelApi` |
| `src/hooks/use-api-queries.ts` | Add `useBloodPanels`, `useCreateBloodPanel`, `useDeleteBloodPanel`, `useAnalyzeBloodPanel` |
| `src/pages/Snapshots.tsx` | Add "Blood Panels" tab alongside "Scan History" and "Import". Show panel list, detail view with categorized markers |
| `src/lib/adaptive-engine.ts` | Add `evaluateBloodPanel()` function |
| `schema/d1-schema.sql` | Add `blood_panels` and `blood_markers` tables |
| `.lovable/memory/index.md` | Document blood panel domain model |

## Blood Marker Adaptive Engine Rules (`src/lib/blood-marker-engine.ts`)

Deterministic rules that fire based on marker status and values:

| Condition | Recommendation Type | Example Output |
|-----------|---------------------|----------------|
| ApoB > 90 | `food_guidance` | "ApoB is elevated at 131 mg/dL. Reduce saturated fat, increase soluble fiber (oats, beans). Consider omega-3 supplementation." |
| HDL < 40 | `food_guidance` + `training_insight` | "HDL is low at 28.5. Increase aerobic conditioning (20-30 min, 3x/week). Add olive oil, nuts, fatty fish." |
| Triglycerides > 149 | `food_guidance` | "Triglycerides elevated at 265. Reduce refined carbs and alcohol. Increase omega-3 intake." |
| TG/HDL ratio > 2.5 | `training_insight` | "TG/HDL ratio of 9.29 suggests insulin resistance risk. Prioritize resistance training and reduce simple carbs." |
| Testosterone < 300 (male) | `training_insight` + `food_guidance` | "Total testosterone is low-average at 287. Prioritize compound lifts, ensure 7-9 hrs sleep, zinc/magnesium adequacy." |
| Vitamin D < 40 | `food_guidance` | "Vitamin D at 39.8 is suboptimal. Supplement 2000-4000 IU/day with a fat-containing meal." |
| hs-CRP > 1.0 | `training_insight` | "hs-CRP at 2.70 indicates moderate inflammation. Monitor recovery, avoid overtraining, increase anti-inflammatory foods." |
| Ferritin > 300 | `training_insight` | "Ferritin is elevated. Consider monitoring — very high levels can indicate inflammation." |

These produce `AdaptiveRecommendation[]` and merge into the existing recommendations feed on the Dashboard.

## CSV Import Flow

1. User pastes CSV (format: `marker,value,unit,reference_range,status,time`)
2. Parse with header detection, split reference_range into min/max
3. Validate with Zod schema
4. Preview parsed markers in a table with status badges (green/yellow/red)
5. Save → creates `BloodPanel` → runs `evaluateBloodPanel()` → generates recommendations

## UI: Blood Panel Detail View

- Markers grouped by category (Hormones, Lipids, Metabolic)
- Each marker shows: name, value + unit, reference range bar, status badge
- Out-of-range markers highlighted with red/amber badges
- Panel-over-panel comparison (like body comp comparison) showing marker trends

## Priority Order

1. Types + mock data + API client
2. CSV import dialog with validation
3. Blood panel detail display on Snapshots page
4. Blood marker adaptive engine rules
5. Dashboard integration (show blood insights in recommendations)
6. D1 schema update

