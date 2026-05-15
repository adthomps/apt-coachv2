# UI State Map

Per APT design doctrine, every async/data-bound view must declare its states.

| Feature | Loading | Empty | Error | Disabled | Success |
|---|---|---|---|---|---|
| `pages/Today` | Skeleton hero | "No log yet — start your day" CTA | Toast + retry | n/a | Vitals + checkin + protocol |
| `pages/Dashboard` | Per-card skeletons | Per-source "No data" with import CTA | Inline retry per card | n/a | Source cards + insights |
| `health/DexaView` | Spinner over KPI grid | EmptyState → Admin import | Inline error banner | Compare disabled when only 1 snapshot | KPI + compare strip + insights |
| `health/RythmBloodView` | Skeleton table | EmptyState → Admin import | Parse-error banner | Compare disabled when only 1 panel | KPI + markers + insights |
| `health/WithingsScaleView` | Spinner | EmptyState | Banner | n/a | KPI + trend |
| `health/SkulptView` | Spinner | EmptyState | Banner | n/a | Per-muscle MQ |
| `health/AppleHealthView` | Spinner | EmptyState | Banner | n/a | Activity tiles |
| `health/LumenView` | Spinner | EmptyState | Banner | n/a | Fuel score trend |
| `pages/Schedule` | Skeleton week grid | "No sessions scheduled" | Banner | Past sessions read-only | Week grid + tooltips |
| `pages/Programs` | Skeleton list | EmptyState | Banner | n/a | Program list |
| `pages/Workouts` | Skeleton list | EmptyState | Banner | n/a | Workout list |
| `pages/Exercises` | Skeleton grid | EmptyState | Banner | n/a | Exercise grid + filters |
| `pages/Snapshots` | Skeleton | EmptyState | Banner | n/a | Snapshot list + compare |
| `pages/Admin` | n/a | Per-tab empty | Per-job error chip | Imports disabled while job running | Tab grid + import history |

Gaps to backfill (tracked separately):

- DEXA/Withings/Skulpt views currently render `null` on error instead of retry banner.
- Today has no offline banner.
