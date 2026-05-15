import { differenceInDays } from 'date-fns';
import type { HealthCheckin } from '@/lib/api/types';

/** Pick the checkin closest in time to target date (within `windowDays`). */
export function nearestCheckin(
  checkins: HealthCheckin[],
  targetDate: string,
  windowDays = 30,
): HealthCheckin | null {
  if (!checkins.length) return null;
  const target = new Date(targetDate);
  let best: { c: HealthCheckin; d: number } | null = null;
  for (const c of checkins) {
    const d = Math.abs(differenceInDays(new Date(c.date), target));
    if (d > windowDays) continue;
    if (!best || d < best.d) best = { c, d };
  }
  return best?.c ?? null;
}

export function formatDelta(curr?: number, ref?: number, suffix = ''): string | null {
  if (curr === undefined || ref === undefined) return null;
  const v = curr - ref;
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}${suffix}`;
}

export function deltaTone(delta: number, invert = false): 'fav' | 'unfav' | 'neutral' {
  if (delta === 0) return 'neutral';
  const positiveIsGood = !invert;
  return (positiveIsGood ? delta > 0 : delta < 0) ? 'fav' : 'unfav';
}
