## Goal

Produce a single, paste-ready markdown document that:
1. Describes the current **Today** page and **Dashboard** ("Command Center") in plain language — what they show, the data model behind them, the layout, the interactions.
2. Embeds a **one-shot prompt** another coding assistant (Cursor, Claude, etc.) can drop into a different React + Tailwind + shadcn project to recreate the same screens — without copying our codebase.

Saved to `/mnt/documents/today-and-dashboard-spec.md` and surfaced as a downloadable artifact.

## What goes in the document

### 1. Product framing (short)
- App: **APT Fitness Coach** — body-composition-aware strength + nutrition coaching, not a generic tracker.
- Core principle: every recommendation cites the scan / marker / session it came from.
- Units: pounds (lbs) for all mass.

### 2. Today page — feature spec
- Route: `/today`. Purpose: day-at-a-glance hub.
- Sections (in order):
  1. **Header**: "Today — {Weekday, Month Day}" + morning body-weight input (lbs) on the right.
  2. **Nutrition** — `NutritionBar` with 4 KPI tiles (Calories / Protein / Carbs / Fat) showing `consumed / target` with a small dot indicator when a macro is manually overridden.
  3. **Targets panel** (collapsible) — phase selector (Aggressive Cut / Cut / Maintain / Lean Gain with kcal delta), activity-level toggle (Sedentary → Athlete, 1.2× → 1.9×), per-macro override inputs, "effective from" date, Save → versions a `NutritionGoal` record.
  4. **Targets explainer** — `MetricExplainer` showing how the targets were derived (BMR, TDEE, phase delta, carb/fat split, overrides).
  5. **Meals** — four collapsible meal cards (Breakfast / Lunch / Dinner / Snacks). Each row: item label, P / C / F / Cal inputs (Cal auto-computes from `4P + 4C + 9F` if blank). Add / delete inline.
  6. **Today's Training** — three states: completed (workout name + duration + total sets + RPE), scheduled (workout name + Start CTA → `/workouts/{id}/start`), or rest day (recovery prompt).
  7. **Daily Signals** — up to 3 short, computed coaching lines (protein gap > 30 g, calorie under/over thresholds, "on track" when protein hit and calories ≤ target+100).

#### Nutrition target engine
Pure TS, no backend. Inputs: latest DEXA `Snapshot`, optional `ProgressCompare`, optional `NutritionGoal`.
- Protein = `round(leanMass)` g (1 g per lb of lean mass).
- BMR = Katch-McArdle from lean mass (lbs → kg internally).
- TDEE = `BMR × activityMultiplier`.
- Phase delta (kcal): aggressive_cut −750, cut −500, maintain 0, lean_gain +200.
- Trend nudge (Maintain only): fat ↑ → −200, clean lean ↑ → +150, lean ↓ → +250.
- Carb/fat split by body fat %: <15 → 65/35, <22 → 55/45, else 40/60. Computed from calories minus protein calories.
- Manual overrides applied last, per macro, with a recompute of the leftover split when only some are set.
- Returns `NutritionTargets` with `source`, `reasoning`, `autoBaseline`, `overridden` flags.

#### Versioned `NutritionGoal`
- Stored as immutable records keyed by `effectiveFrom` (YYYY-MM-DD).
- Active goal for a date = the latest record where `effectiveFrom <= date`.
- Fields: phase, activityMultiplier, overrides {calories?, protein?, carbs?, fat?}, notes.

### 3. Dashboard ("Command Center") — feature spec
- Route: `/dashboard`. Purpose: weekly orientation across health + training.
- Empty state: when no DEXA, blood panel, or smart-scale data exists → single CTA card driving to imports.
- Sections:
  1. **PageHeader** — "Command Center" + greeting using first name.
  2. **Health Command Summary** (feature card):
     - Headline insight (top body-scan or blood insight): category badge, title, rationale, "Evidence: {label} {value} · {date}", optional "the science" explainer.
     - Three columns: **Active Signals** (chips for lean Δ, fat Δ, markers in/out of range, current data inputs), **Priority Direction** (first action of the headline insight + protein-target chip), **Training Continuity** (adherence %, completed/total, streak chip, next session weekday chip).
  3. **Health Direction grid** — three SourceCards: DEXA, Rythm Health (blood), Withings. Each: status badge (Optimal / Watch / Concern / No data), 2 KPI tiles, Priority Action, Food Guidance, footer link to `/health`.
     - DEXA status from BF%: <18 optimal, <25 watch, else concern.
     - Rythm status from out-of-range count: 0 optimal, 1–2 watch, ≥3 concern.
  4. **Training section** — pulse strip (sessions/14d, volume/14d, adherence, upcoming count), three columns: Upcoming (next 3 scheduled w/ Start), Latest Session (completion %, volume, duration, calories/HR/RPE chips, view detail), Training Insights (de-duped from last 5 sessions).
  5. **Supporting Insights** — `AIInsightsPanel` with the remaining top-6 body + panel insights, each citing its source.

### 4. Domain types (compact)
List the minimum types another assistant needs: `Snapshot`, `BodyComposition`, `ProgressCompare`, `BloodPanel`, `BloodMarker`, `ScheduleEntry`, `WorkoutSession`, `DailyLog`, `MealEntry`, `MealSlot`, `NutritionGoal`, `NutritionTargets`, `GoalPhase`, plus the `GOAL_PHASE_DELTA` and `ACTIVITY_LEVELS` constants.

### 5. Design conventions
- React 18 + Vite + TypeScript + Tailwind + shadcn/ui.
- Semantic color tokens only (`bg-muted`, `text-muted-foreground`, `border-border`, `text-primary`, etc.) — no raw colors.
- Layout primitives reused: `PageHeader`, `SectionCard` (with optional `variant="feature"`), `EmptyState`, `KpiStat`, `StatusBadge`, `MetricExplainer`, `Chip`-style rounded badges.
- Lucide icons throughout.
- `react-router-dom` for links to `/health`, `/training`, `/schedule`, `/workouts/:id/start`, `/sessions/:id`.
- Mock-API friendly: each page consumes hooks (`useDailyLog`, `useSnapshots`, `useBloodPanels`, `useSchedule`, `useSessions`, `useActiveNutritionGoal`, `useAddMeal`, `useDeleteMeal`, `useLogWeight`, `useCreateNutritionGoal`) so the recipient can wire any backend.

### 6. The one-shot prompt (verbatim block)
A self-contained prompt the user can paste into another assistant. It will:
- State the stack and conventions.
- List the two routes and every section with the exact ordering and copy.
- Include the nutrition-target formulas and constants.
- Include the minimum TypeScript interfaces.
- Tell the assistant to stub the hooks behind a typed mock layer if no backend exists.
- Demand semantic tokens, Lucide icons, shadcn primitives, no raw colors.

## Deliverable

`/mnt/documents/today-and-dashboard-spec.md` rendered as a `<lov-artifact>` so the user can download it directly.

No code changes to the project.