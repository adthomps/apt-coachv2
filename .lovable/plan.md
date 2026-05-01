
# Daily System Page — "/today"

A single day-at-a-glance hub combining today's training, macro logging, nutrition targets (derived from body composition), and health signals.

---

## 1. New route: `/today`

Add to App.tsx and nav. This becomes the daily operational page — Dashboard stays as the strategic overview.

## 2. Domain types (`src/lib/api/types.ts`)

```text
MealEntry {
  id, label (e.g. "Breakfast"), protein, carbs, fat, calories, notes?, timestamp
}

DailyLog {
  id, date (YYYY-MM-DD),
  meals: MealEntry[],
  bodyWeight?: number (lbs),
  notes?: string
}

NutritionTargets {
  calories, protein, carbs, fat  — all numbers
  source: 'protocol' | 'custom'
}
```

## 3. Nutrition target engine (`src/lib/nutrition-targets.ts`)

Derives daily macro targets from the latest Snapshot + Protocol logic:
- **Protein**: 1g per lb lean mass (already in protocol.ts)
- **Calories**: estimated TDEE from lean mass × activity multiplier, then adjusted for current goal (surplus/deficit based on fat-mass trend from ProgressCompare)
- **Carbs/Fat**: remaining calories split based on body fat % (lower BF% → higher carb ratio)

Returns `NutritionTargets` with the computed values and reasoning strings.

## 4. Mock API layer (`src/lib/api/client.ts`)

Add `dailyLogApi`:
- `getByDate(date)` — returns or creates a DailyLog
- `addMeal(date, meal)` — appends a MealEntry
- `updateMeal(date, mealId, partial)` — edits a meal
- `deleteMeal(date, mealId)` — removes a meal
- `updateWeight(date, weight)` — logs morning weight

Backed by in-memory mock store (same pattern as existing APIs).

## 5. React Query hooks (`src/hooks/use-api-queries.ts`)

Add `useDailyLog(date)`, `useAddMeal`, `useUpdateMeal`, `useDeleteMeal`, `useLogWeight` mutations with optimistic updates.

## 6. Page layout: `src/pages/Today.tsx`

Top-to-bottom sections using existing `SectionCard`, `KpiStat`, `DeltaValue`, `MetricExplainer`:

### A. Header
- "Today — [Day, Month Date]"
- Morning weight input (single inline field, logs on blur/enter)

### B. Nutrition Summary Bar
- Four `KpiStat` tiles: Calories, Protein, Carbs, Fat
- Each shows consumed / target with a progress indicator
- Protein target auto-derived from lean mass; calories from the nutrition engine
- `MetricExplainer` disclosure: "Why this target" — explains the body-comp derivation

### C. Meal Log
- Collapsible meal slots: Breakfast, Lunch, Dinner, Snacks
- Each meal: quick-add row with protein/carbs/fat/cal fields + optional label
- Running subtotals per meal
- Add/edit/delete with `DeleteConfirmDialog`

### D. Today's Training
- If a scheduled workout exists: show workout name, estimated duration, "Start" button (links to `/workouts/:id/start`)
- If completed: show session summary (sets completed, duration, RPE)
- If rest day: show rest-day messaging

### E. Daily Signals (compact)
- Pull top 2-3 health signals from `HealthCommandSummary` logic
- Body-comp-aware nudges from the nutrition engine (e.g. "You're 40g short on protein")

## 7. Components

| Component | Location | Purpose |
|---|---|---|
| `NutritionBar` | `src/components/daily/NutritionBar.tsx` | Four KPI tiles with progress rings |
| `MealCard` | `src/components/daily/MealCard.tsx` | Collapsible meal with macro entry rows |
| `MealEntryRow` | `src/components/daily/MealEntryRow.tsx` | Inline form: label + P/C/F/cal inputs |
| `DailyTrainingCard` | `src/components/daily/DailyTrainingCard.tsx` | Today's workout status |
| `DailySignals` | `src/components/daily/DailySignals.tsx` | Compact health nudges |

All components reuse `SectionCard`, `KpiStat`, `DeltaValue`, `MetricExplainer` — no new design primitives.

## 8. Navigation

Add "Today" link to nav (Layout.tsx), placed first before Dashboard. Icon: `CalendarCheck` or `Sun` from lucide.

## 9. Files affected

- **New**: `src/pages/Today.tsx`, `src/lib/nutrition-targets.ts`, `src/components/daily/NutritionBar.tsx`, `MealCard.tsx`, `MealEntryRow.tsx`, `DailyTrainingCard.tsx`, `DailySignals.tsx`
- **Modified**: `src/lib/api/types.ts` (new types), `src/lib/api/client.ts` (dailyLogApi), `src/hooks/use-api-queries.ts` (new hooks), `src/App.tsx` (route), `src/components/Layout.tsx` (nav link)

## 10. What this does NOT include

- No food database / search / barcode scanning (macro-only as chosen)
- No persistent backend — stays in mock API layer consistent with current architecture
- No meal planning or recipe features
- No calorie counting from external APIs

## Validation

- Type-check passes
- Page renders with mock data showing nutrition targets derived from latest snapshot
- Meal CRUD works (add, edit, delete)
- Targets update when snapshot data changes
