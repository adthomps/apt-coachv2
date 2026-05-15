/**
 * APT shared selectors for health data.
 *
 * Centralizes "what is the latest scan / panel / checkin" + "compare pair"
 * so Today, Dashboard, and Health source views all render the same numbers.
 */

import type { Snapshot, BloodPanel, ProgressCompare } from '@/lib/api/types';

export const isWithings = (s: Snapshot) =>
  (s.provider || '').toLowerCase() === 'withings';

export function selectDexaSorted(snapshots: Snapshot[]): Snapshot[] {
  return snapshots
    .filter(s => !isWithings(s))
    .sort((a, b) => b.scanDate.localeCompare(a.scanDate));
}

export function selectWithingsSorted(snapshots: Snapshot[]): Snapshot[] {
  return snapshots
    .filter(isWithings)
    .sort((a, b) => b.scanDate.localeCompare(a.scanDate));
}

export function selectLatestDexa(snapshots: Snapshot[]): Snapshot | null {
  return selectDexaSorted(snapshots)[0] ?? null;
}

export function selectLatestWithings(snapshots: Snapshot[]): Snapshot | null {
  return selectWithingsSorted(snapshots)[0] ?? null;
}

export function selectPanelsSorted(panels: BloodPanel[]): BloodPanel[] {
  return [...panels].sort((a, b) => b.panelDate.localeCompare(a.panelDate));
}

export function selectLatestPanel(panels: BloodPanel[]): BloodPanel | null {
  return selectPanelsSorted(panels)[0] ?? null;
}

/**
 * Build a ProgressCompare from the two most recent DEXA snapshots.
 * Used by Today + Dashboard so deltas are always identical.
 */
export function selectDexaComparePair(snapshots: Snapshot[]): ProgressCompare | undefined {
  const sorted = selectDexaSorted(snapshots);
  const latest = sorted[0];
  const previous = sorted[1];
  if (!latest || !previous) return undefined;
  const cur = latest.bodyComposition;
  const prev = previous.bodyComposition;
  return {
    currentSnapshot: latest,
    previousSnapshot: previous,
    changes: {
      totalMass: {
        value: cur.totalMass - prev.totalMass,
        percentage: ((cur.totalMass - prev.totalMass) / prev.totalMass) * 100,
      },
      fatMass: {
        value: cur.fatMass - prev.fatMass,
        percentage: ((cur.fatMass - prev.fatMass) / prev.fatMass) * 100,
      },
      leanMass: {
        value: cur.leanMass - prev.leanMass,
        percentage: ((cur.leanMass - prev.leanMass) / prev.leanMass) * 100,
      },
      bodyFatPercentage: {
        value: cur.bodyFatPercentage - prev.bodyFatPercentage,
        percentage: cur.bodyFatPercentage - prev.bodyFatPercentage,
      },
      regionalChanges: [],
    },
    timeSpanDays: Math.round(
      (new Date(latest.scanDate).getTime() - new Date(previous.scanDate).getTime()) / 86400000,
    ),
  };
}

export function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
