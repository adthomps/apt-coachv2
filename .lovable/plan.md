# Input Consistency Audit + Standardization Plan

Goal: every place a user enters data — chips, popovers, modals, sheets, inline rows — uses the same APT primitives, spacing, tone, and color tokens.

## What I found

### Today page input surfaces
| Surface | Component | Current state |
|---|---|---|
| Chip popover (each vital) | `DailyInputsCard.StatusChip` + `ChipEditor` | Custom popover, **uses `amber-500` raw color** for "pending" state (off-system) |
| Headline tile | `DailyInputsCard.HeadlineTile` | Custom card, OK tokens |
| "Edit all" modal | `DailyInputsCard` → raw `Dialog` + `DailySignalsTabs` | Raw `DialogContent` (not `FormDialog`); no shared footer; tabs grid OK |
| Per-source tab grid | `DailySignalsTabs` | Inline `Input` + `Label` + `Select`, blur-to-save, OK |
| Meal entry add | `MealCard` + `MealEntryRow` | Inline input row, no labels, dashed "add" affordance — visually different from every other input on the page |
| Meal entry edit | (none — only delete) | Missing edit path |
| Day Goals | `DayGoalsCard` | Read-only tiles, "Edit" button → `/settings` |

### Across the rest of the app
| File | Pattern | Issue |
|---|---|---|
| `ExerciseDialog`, `WorkoutDialog`, `Training` page dialogs | `FormDialog` | ✅ canonical |
| `BloodPanelImportDialog` | raw `DialogContent` + bespoke footer + `bg-success/20` badge | Not using `FormDialog`; inconsistent footer; inline color tokens OK |
| `SnapshotImportDialog` | raw `DialogContent` + tabs + full-width `Button` | Not using `FormDialog`; no standard footer |
| `WithingsImportDialog` | raw `DialogContent` + full-width `Button` | Not using `FormDialog` |
| `DeleteConfirmDialog` | `AlertDialog` | ✅ correct (destructive confirms) |
| `Schedule` page | `Sheet` for day detail + `Dialog` for create | Mixed; create dialog should be `FormDialog` |
| `DailyInputsCard` "Edit all" | raw `Dialog` | Should be `FormDialog` (size xl, no submit → use a "Done" close) |

### Color/tone inconsistencies
- `DailyInputsCard.StatusChip` → `border-amber-500/40 bg-amber-500/10 text-amber-500` (raw Tailwind palette).
  → Should be `border-warning/40 bg-warning/10 text-warning` (semantic).
- `BloodPanelImportDialog` → `bg-success/20 text-success border-success/30` for "Optimal" badge.
  → Already semantic; keep, but route through `StatusBadge` component.
- Several places still call `text-success` for "logged" chip — that's fine (success token), but worth confirming earlier "no green" rule. **Question for you below.**

## Standardization plan

### 1. One canonical input system
Document and enforce three primitives:

- **`FormDialog`** — all modal create/edit (sizes md / lg / xl). Always submit + cancel in shared footer.
- **`PopoverEditor`** (new, extracted from `DailyInputsCard.ChipEditor`) — the inline single-field popover used by chips. Standard header (icon + label + source), one body slot, Save/Cancel footer.
- **`InlineRow`** (new, generalizing `MealEntryRow`) — labeled compact row used inline inside cards. Enter to save, blur to commit, trash to delete.

### 2. Migrations
- `BloodPanelImportDialog`, `SnapshotImportDialog`, `WithingsImportDialog` → wrap in `FormDialog` (size lg). Move JSON paste into the body, primary "Import" in shared footer, secondary tab toggle stays at top.
- `Schedule` create-workout dialog → `FormDialog`.
- `DailyInputsCard` "Edit all" modal → `FormDialog` size xl, single "Done" action (no submit needed since fields commit on blur).
- `MealCard`/`MealEntryRow` → align to `InlineRow`: add labels above the four small inputs (P/C/F/Cal) on first row only, keep dashed-button affordance, add **Edit** action on existing entries (clicking entry opens `InlineRow` in edit mode).

### 3. Color/tone pass
- Replace all `amber-*` raw classes with `warning` semantic token (chip pending, any other occurrences).
- Sweep for `green-*`, `emerald-*`, `lime-*` raw classes — none expected, confirm.
- Confirm "logged" chip color: keep `success` (semantic green) **OR** switch to `primary` per the earlier "revisit green" note.

### 4. Spacing/typography pass
- All dialog bodies use `space-y-5`, all field groups `space-y-2`, all labels `text-xs text-muted-foreground` (already in `DailySignalsTabs`).
- All field grids: 2-col on mobile, 4-col on `md+` for short fields.

## Out of scope
- Backend/API changes
- New input fields beyond the meal-entry edit path
- Redesign of `Schedule` sheet (keep)

## Question before I implement

Two open decisions — please pick:

**A. Pending/incomplete tone for chips:**
- (i) `warning` (amber/orange) — current intent
- (ii) `muted` (subtle gray) — quieter

**B. "Logged / on-target" tone (the green question):**
- (i) Keep `success` (semantic green, no raw greens)
- (ii) Switch to `primary` (your brand color) and reserve green for nothing
- (iii) Use `accent`

Once you answer, I'll execute the migrations + token sweep in one pass.
