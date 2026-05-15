## Today page — input enhancements

Three connected changes, all UI/presentation. No business-logic or backend changes beyond extending the `DailyVitals` Lumen fields.

---

### 1. Lumen — multi-event capture

Replace the two-field Lumen model (`lumenMorningLevel`, `lumenPeakLevel`) with a per-event slot model.

**Events** (in order): Wake Up, Pre-Workout, Post-Workout, Pre-Meal, Post-Meal, Fasting, Bedtime.

**Score legend** (always visible inline in the editor):

```
1  Burning fat (morning goal 80–100% fat)
2  Mostly fat (morning goal 60–80% fat)
3  Mixed fat + carbs (40–60% fat)
4  Mostly carbs (60–80% carbs)
5  Burning carbs (80–100% carbs)
```

**Type changes** (`src/lib/api/types.ts`):
- Add `LumenEvent = 'wake_up' | 'pre_workout' | 'post_workout' | 'pre_meal' | 'post_meal' | 'fasting' | 'bedtime'`
- Add `LumenReading = { event: LumenEvent; level?: 1–5; time?: string; notes?: string }`
- Add `DailyVitals.lumenReadings?: LumenReading[]`
- Keep `lumenMorningLevel` / `lumenPeakLevel` as derived/back-compat (computed: Wake Up → morning; max of all → peak) to avoid touching protocol.ts and importers in this pass.

**UI** (new `LumenEventsEditor` rendered inside Daily Inputs "Edit all" dialog under the Lumen tab, replacing the current two selects):
- One row per event: icon + label · `Select` (1–5) · optional time picker · short helper text describing that level.
- Score legend table at top of the tab.
- Chip on the Daily Inputs card stays a single "Lumen · {n logged}" chip; clicking opens the Lumen tab in the Edit-all dialog (popover on the chip removed for Lumen because a single value no longer represents the day).

---

### 2. Day Goals → modal editor

Day Goals currently render as a read-only card with an "Edit goals" button that routes to `/settings`. Make it match the Daily Inputs pattern.

- New `DayGoalsEditorDialog` using `FormDialog` (size `lg`, submit "Save").
- Fields: protein target (g, prefilled from nutrition target), step target, water target (L), session notes / training intent.
- `DayGoalsCard` "Edit goals" opens this dialog instead of navigating away.
- Persistence: store on `DailyLog.goals` (new optional field `{ proteinG?, steps?, waterL?, sessionNote? }`); fall back to derived defaults when absent. No new API surface — reuse `useUpdateDailyVitals`-style mutation extended to a `useUpdateDayGoals` hook against the existing daily log mock.

---

### 3. Nutrition Goals — consistent "set value" treatment

Today the `NutritionTargetsPanel` is in-page collapsible with Phase + Activity as toggles and per-macro fields under "Manual Overrides". Phase and Activity are also overrides of the auto baseline, so the framing is inconsistent.

Changes:
- Move the entire panel into a modal: `NutritionTargetsDialog` (`FormDialog`, size `lg`).
- The Nutrition Goals card surface becomes a compact summary row (phase chip · activity chip · kcal/P/C/F target) with a single **Edit targets** button → opens the dialog.
- Inside the dialog, restructure as three field groups, all framed as "set values" (no separate "manual override" header):
  1. **Goal phase** — toggle group (existing).
  2. **Activity level** — toggle group (existing).
  3. **Macro targets** — four numeric inputs prefilled with the auto-computed baseline; a per-field "Reset to auto" link clears the override. A small helper text shows the auto baseline next to each input.
- Indicator: any field whose value differs from auto baseline shows a small `Overridden` dot (reuses existing `bg-accent` token), matching the pattern used in `NutritionBar`.
- "Effective from" + Save move to the dialog footer (Save = primary action via FormDialog).

---

### Technical notes

- All new modals use `FormDialog` for header/body/footer parity with the rest of the input standardization pass.
- Color tokens only — `primary`/`muted`/`warning`/`accent`. No raw Tailwind colors.
- No changes to `protocol.ts`, `nutrition-targets.ts` math, importers, or hooks beyond a new `useUpdateDayGoals` and Lumen reading writes. Existing consumers of `lumenMorningLevel`/`lumenPeakLevel` keep working via the derived back-compat values.

### Files touched

- `src/lib/api/types.ts` — Lumen types, `DailyLog.goals`.
- `src/lib/api/mock-data.ts` + `src/lib/api/client.ts` — Lumen readings + day-goals read/write.
- `src/hooks/use-api-queries.ts` — `useUpdateDayGoals`, Lumen reading mutation.
- `src/components/daily/DailySignalsTabs.tsx` — Lumen tab swap to `LumenEventsEditor`.
- `src/components/daily/LumenEventsEditor.tsx` (new).
- `src/components/daily/DailyInputsCard.tsx` — Lumen chip becomes summary that opens Edit-all → Lumen tab.
- `src/components/daily/DayGoalsCard.tsx` — `onEdit` opens dialog instead of navigating.
- `src/components/daily/DayGoalsEditorDialog.tsx` (new).
- `src/components/daily/NutritionTargetsPanel.tsx` — collapse into compact summary + trigger.
- `src/components/daily/NutritionTargetsDialog.tsx` (new) — extracted form body in a `FormDialog`.
- `src/pages/Today.tsx` — wiring.

### Out of scope

- Backend / D1 schema changes.
- Importer changes for Lumen multi-event (still beta — keep current single-level mapping).
- Recompute of protocol/recommendation logic from per-event Lumen.
