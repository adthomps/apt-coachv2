APT Fitness Coach - body-composition-aware strength coaching system (not a generic tracker)

## Brand
- App name: "APT Fitness Coach" / "APT Coach"
- localStorage key: `apt_coach_user`

## Domain Model
- Exercise: slug-based, movementPattern (not category), cues, substitutions
- MovementPattern: horizontal_push/pull, vertical_push/pull, hip_hinge, knee_dominant, core, isolation
- WorkoutBlock types: straight_sets, superset, giant_set, six_twelve_twentyfive, drop_set
- Workout: collection of WorkoutBlocks
- Program: days with dayNumber (not dayOfWeek), no weeks/schedule
- Snapshot: replaces DexaScan, includes rawJson from BodySpec
- ProgressCompare: replaces DexaComparison
- Protocol: client-side logic in src/lib/protocol.ts producing Recommendation + FoodSuggestion
- DailyLog: date-keyed, meals (breakfast/lunch/dinner/snacks), bodyWeight
- MealEntry: label + protein/carbs/fat/calories (macro-only, no food database)
- NutritionTargets: derived from body composition via src/lib/nutrition-targets.ts

## Routes
/today, /dashboard, /exercises, /workouts, /programs, /snapshots, /admin

## Removed Features
- Calendar, WorkoutSession, Analytics, AIAnalytics, MuscleMap
- sessionApi, statsApi, workoutLogApi — not in MVP
- No scheduling, no live session logging

## Tech Direction
- Frontend-first with mock API layer
- Structured for future: React + Vite + Tailwind + Cloudflare Workers + Hono + D1
- API client in src/lib/api/client.ts with workoutApi (not templateApi)
