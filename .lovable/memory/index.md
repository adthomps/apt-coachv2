APT Fitness Coach - body-composition-aware strength coaching system (not a generic tracker)

## Brand
- App name: "APT Fitness Coach" / "APT Coach"
- localStorage key: `apt_coach_user`

## Design System (APT v1)
- Dark-first: `<html class="dark">`, dark mode is primary experience
- Color hue family: 220 (blue primary) + 165 (teal accent)
- Primary: `220 70% 55%` (dark), `220 70% 50%` (light)
- Accent: `165 55% 45%` (teal) — replaces old green accent
- Border radius: `--radius: 0.5rem` (was 0.75rem)
- Typography: page titles `text-3xl md:text-4xl font-bold tracking-tight`
- Animations: `apt-fade-in`, `apt-slide-up`, `apt-hover-lift`, `apt-glow-subtle`
- Interactive cards get `apt-hover-lift` class

## Units
- All mass/weight values in **pounds (lbs)** — American standard
- Snapshot import accepts both lbs and kg (auto-converts kg to lbs)
- Protein target: 1g per lb of lean mass

## Architecture (Updated)
- React Query (`useQuery`/`useMutation`) for all data fetching
- Query hooks centralized in `src/hooks/use-api-queries.ts` with `queryKeys` object
- Zod validation schemas in `src/lib/validations.ts` for all CreateInput types
- Structured errors in `src/lib/api/errors.ts` (AppError class, ErrorCode constants)
- ErrorBoundary wraps entire app in App.tsx
- DeleteConfirmDialog component for all destructive actions
- Role-based route protection: ProtectedRoute accepts `requiredRole` prop
- AuthContext includes `role: UserRole` and `hasRole()` method
- Admin nav link conditionally rendered via `hasRole('admin')`
- SnapshotImportDialog: structured form + JSON paste modes
- HTTP client wrapper in `src/lib/api/http-client.ts` with `USE_MOCK_API` flag

## Domain Model
- Exercise: slug-based, movementPattern (not category), cues, substitutions
- MovementPattern: horizontal_push/pull, vertical_push/pull, hip_hinge, knee_dominant, core, isolation
- WorkoutBlock types: straight_sets, superset, giant_set, six_twelve_twentyfive, drop_set
- Workout: collection of WorkoutBlocks
- Program: days with dayNumber (not dayOfWeek), no weeks/schedule
- Snapshot: body composition from BodySpec, includes rawJson
- BloodPanel: blood markers from RythmHealth (CSV import), includes rawCsv
- BloodMarker: marker, value, unit, referenceRange, referenceMin/Max, status (optimal/average/outOfRange)
- Marker categories: hormones, lipids, metabolic
- ProgressCompare: replaces DexaComparison
- Protocol: client-side logic in src/lib/protocol.ts

## Adaptive Engine
- `src/lib/adaptive-engine.ts` — training performance, body composition, schedule adherence
- `src/lib/blood-marker-engine.ts` — blood marker analysis (ApoB, HDL, TG, testosterone, vitamin D, hs-CRP, ferritin)
- Both produce AdaptiveRecommendation[] with type, rationale, confidence score
- Engine never silently rewrites programs — produces suggestions only

## Routes
/dashboard, /exercises, /workouts, /workouts/:id/start, /programs, /schedule, /sessions, /snapshots, /settings, /admin (requires admin role)

## Migration Prep
- D1 schema defined in `schema/d1-schema.sql` (includes blood_panels + blood_markers tables)
- API route contract in `mem://features/api-routes.md`
- Target stack: Cloudflare Workers + Hono + D1
- `src/lib/api/http-client.ts` — `apiFetch` wrapper ready for real backend
- API client in `src/lib/api/client.ts` (mock), swap via `USE_MOCK_API` flag
