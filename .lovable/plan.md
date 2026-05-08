
# Daily Macro Targets — Auto Baseline + Manual Overrides

Give the user control over daily calorie/protein/carb/fat targets while keeping the body-composition-aware auto baseline as the default. Targets become a first-class, versioned record so we can chart them against actuals over time.

---

## 1. Domain model changes (`src/lib/api/types.ts`)

```text
GoalPhase = 'aggressive_cut' | 'cut' | 'maintain' | 'lean_gain'

PhaseDelta (kcal):
  aggressive_cut: -750
  cut:            -500
  maintain:        0
  lean_gain:      +200

NutritionGoal {
  id
  effectiveFrom: string (YYYY-MM-DD)
  phase: GoalPhase
  activityMultiplier: number          // default 1.55
  overrides: {                        // any subset; null = use auto
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  notes?: string
  createdAt: string
}
```

Extend `NutritionTargets` with:
- `phase: GoalPhase`
- `activityMultiplier: number`
- `autoBaseline: { calories, protein, carbs, fat }`  — what the engine would have computed
- `overridden: { calories: boolean, protein: boolean, carbs: boolean, fat: boolean }`

`source` becomes `'auto' | 'phase_adjusted' | 'overridden'`.

## 2. Engine update (`src/lib/nutrition-targets.ts`)

`computeNutritionTargets(snapshot, compare, goal?)`:

1. Compute auto baseline (existing logic, but the trend-based ±150/200/250 adjustment moves into a separate helper so it can coexist with phase delta).
2. If `goal` provided:
   - Use `goal.activityMultiplier` instead of the hardcoded 1.55.
   - Apply `PhaseDelta[goal.phase]` to calories instead of (not in addition to) the trend nudge. Keep trend nudge only when phase is `maintain`.
   - Recompute carbs/fat split from remaining calories using current body-fat % rule.
   - Apply per-macro overrides last; if calories are overridden, recompute carb/fat from remainder unless those are also overridden.
3. Return enriched `NutritionTargets` with `autoBaseline`, `overridden` flags, and a refreshed `reasoning` string that names the phase, activity, and any overrides.

## 3. API + persistence (`src/lib/api/client.ts`)

Add `nutritionGoalApi` (mock store, same pattern as other apis):

- `list()` → `NutritionGoal[]` sorted by `effectiveFrom` desc
- `getActive(date)` → most recent goal with `effectiveFrom <= date`
- `create(input)` → new versioned record (never edits past records)
- `delete(id)` → remove a future-dated draft

Today.tsx will resolve targets via:
```text
const goal = await nutritionGoalApi.getActive(today)
const targets = computeNutritionTargets(snapshot, compare, goal)
```

## 4. Hooks (`src/hooks/use-api-queries.ts`)

- `useNutritionGoals()`
- `useActiveNutritionGoal(date)`
- `useCreateNutritionGoal()` — invalidates active-goal + daily-log queries

## 5. UI: inline panel on `/today`

New component `src/components/daily/NutritionTargetsPanel.tsx`, rendered as a `Collapsible` directly under `NutritionBar`.

Header row (always visible):
- Current phase chip (e.g. "Lean Gain · 1.55× activity")
- "Edit targets" toggle

Expanded body:
- **Phase selector** — 4 segmented buttons: Aggressive Cut · Cut · Maintain · Lean Gain. Each shows its kcal delta beneath the label.
- **Activity multiplier** — segmented control: 1.2 Sedentary · 1.375 Light · 1.55 Moderate · 1.725 Hard · 1.9 Athlete.
- **Per-macro override grid** — four numeric inputs (Cal / P / C / F). Each shows the auto value in placeholder; a "Reset" link appears next to any field that is overridden.
- **Effective from** — date picker, defaults to today; locks past dates so history stays intact.
- **Save** button → calls `useCreateNutritionGoal`. Toast: "New target active from {date}."
- **Why these numbers** — reuses `MetricExplainer` showing the engine's reasoning string (auto baseline + phase + overrides).

Visual: reuses `SectionCard`, `Button`, `Input`, `Label`, existing segmented-control pattern (build with `ToggleGroup`). No new design primitives.

## 6. NutritionBar enhancement

When a value is overridden, append a small "•" indicator next to the target number with a tooltip "Manual override." Keeps the auto vs manual distinction visible at a glance.

## 7. Out of scope for this pass

- No /settings duplication — single source of truth on /today.
- No goal-vs-actual time-series chart yet (the data shape supports it; chart lives in a future /health enhancement).
- No reminders to revisit targets after a new snapshot (future "stale target" nudge in `DailySignals`).
- No labs (blood panel) integration into target math yet — current model uses snapshot only. Future: hsCRP, fasting glucose, lipids could shift carb ratio. Hooked location: the carb/fat split block in `computeNutritionTargets`.

## 8. Files

**New**
- `src/components/daily/NutritionTargetsPanel.tsx`

**Edited**
- `src/lib/api/types.ts` — `GoalPhase`, `NutritionGoal`, enriched `NutritionTargets`
- `src/lib/nutrition-targets.ts` — accepts goal, applies phase + overrides
- `src/lib/api/client.ts` + `src/lib/api/index.ts` — `nutritionGoalApi`
- `src/hooks/use-api-queries.ts` — new hooks
- `src/pages/Today.tsx` — resolve active goal, render panel, pass enriched targets
- `src/components/daily/NutritionBar.tsx` — override indicator

## Validation

- Type-check passes.
- Default state (no goal record) matches current behavior exactly.
- Selecting a phase recomputes calories and macro split immediately.
- Per-macro override persists across reload and shows "•" indicator on the bar.
- Creating a new goal with a future `effectiveFrom` does not change today's targets until that date.
