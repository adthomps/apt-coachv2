## Goal

Remove the "Back fill" header button and "View / back fill past days" calendar button. Users already navigate to past dates by clicking a calendar day or using Prev/Next — the same chip/dialog editors work on any date. The dedicated buttons are redundant.

## Changes

**`src/components/daily/TodayHeader.tsx`**
- Drop the `onBackfill` prop and the Back fill button (and `CalendarDays` import if unused after).

**`src/components/daily/MiniMonthCalendar.tsx`**
- Drop the `onBackfill` prop and the "View / back fill past days" button at the bottom of the card.
- Add a small inline hint under the calendar legend: "Tap any day to edit" (replacing the button's affordance with one line of guidance).

**`src/pages/Today.tsx`**
- Remove `onBackfill={...}` from both `<TodayHeader>` and `<MiniMonthCalendar>` usages.
- Remove the now-unused `useNavigate` if no other call site uses it (it's still used by `YearMonthSignalsCard` → `/health` and `DayGoalsCard` → `/settings`, so keep it).

## Behavior after

- Prev / Today / Next buttons in the header still navigate dates.
- Clicking any day in the mini month calendar selects it (already wired through `setDate`).
- All chip popovers and the "Edit all" dialog write to the selected date — past or present.
- No new components, no schema changes.

## Out of scope

- Future-date guard (allowing edits on future days). Keep current behavior.
- Visual disabling/dimming of future days in the calendar.
