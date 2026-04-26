/**
 * Schedule sync helpers.
 *
 * Keeps the Schedule view in sync with session lifecycle events. Specifically:
 * - When a session is paused (in_progress) or abandoned, today's matching
 *   "scheduled" entry is marked rescheduled and a fresh entry is created
 *   for the next day so the user doesn't lose track of it.
 *
 * All side-effects go through scheduleApi so they pick up the same caching /
 * persistence layer the Schedule view uses.
 */

import { format, addDays, parseISO } from 'date-fns';
import { scheduleApi } from '@/lib/api';
import type { ScheduleEntry } from '@/lib/api/types';

export type ScheduleShiftReason = 'paused' | 'abandoned';

/**
 * Find a scheduled entry for the given workout today (or earlier, if missed).
 * Returns the most recent matching scheduled entry on or before today.
 */
function findActiveScheduledEntry(
  entries: ScheduleEntry[],
  workoutId: string,
): ScheduleEntry | undefined {
  const today = format(new Date(), 'yyyy-MM-dd');
  return entries
    .filter((e) => e.workoutId === workoutId && e.status === 'scheduled' && e.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * Reschedule the matching scheduled entry to the day after its original date.
 * Returns true when a shift was performed.
 */
export async function shiftScheduleForSession(
  workoutId: string,
  workoutName: string,
  reason: ScheduleShiftReason,
): Promise<boolean> {
  try {
    const entries = await scheduleApi.list();
    const target = findActiveScheduledEntry(entries, workoutId);
    if (!target) return false;

    const newDate = format(addDays(parseISO(target.date), 1), 'yyyy-MM-dd');
    const note =
      reason === 'paused'
        ? 'Auto-shifted: session paused mid-workout.'
        : 'Auto-shifted: previous session abandoned.';

    await scheduleApi.update(target.id, { status: 'rescheduled', notes: note });
    await scheduleApi.create({
      date: newDate,
      workoutId,
      workoutName,
      status: 'scheduled',
      notes: `Rescheduled from ${target.date}.`,
    });
    return true;
  } catch {
    return false;
  }
}
