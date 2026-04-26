/**
 * Per-session insights — deterministic rules.
 *
 * Produces structured `Insight` objects with required evidence citations
 * derived directly from the session log + recent history. No invented data.
 */

import type { WorkoutSession, ScheduleEntry } from '@/lib/api/types';
import type { Insight } from './insights';

let counter = 0;
const nextId = () => `sins_${Date.now()}_${++counter}`;

// ============ Snapshot computation ============

export interface SessionSnapshot {
  completionPct: number;
  completedSets: number;
  plannedSets: number;
  totalVolume: number; // lbs * reps
  exerciseCount: number;
  durationMinutes: number | null;
  volumeByExercise: { name: string; volume: number }[];
  hasRpe: boolean;
  hasHeartRate: boolean;
}

export function computeSessionSnapshot(session: WorkoutSession): SessionSnapshot {
  let completedSets = 0;
  let plannedSets = 0;
  let totalVolume = 0;
  let hasRpe = false;
  const volumeByExercise: { name: string; volume: number }[] = [];

  for (const ex of session.exercises) {
    plannedSets += ex.plannedSets;
    let exVolume = 0;
    for (const set of ex.actualSets) {
      if (set.completed) {
        completedSets += 1;
        exVolume += (set.weight || 0) * (set.reps || 0);
      }
      if (set.rpe !== undefined && set.rpe !== null) hasRpe = true;
    }
    totalVolume += exVolume;
    volumeByExercise.push({ name: ex.exerciseName, volume: Math.round(exVolume) });
  }

  let durationMinutes: number | null = null;
  if (session.startedAt && session.completedAt) {
    const ms = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
    if (ms > 0) durationMinutes = Math.round(ms / 60000);
  }

  return {
    completionPct: plannedSets > 0 ? Math.round((completedSets / plannedSets) * 100) : 0,
    completedSets,
    plannedSets,
    totalVolume: Math.round(totalVolume),
    exerciseCount: session.exercises.length,
    durationMinutes,
    volumeByExercise,
    hasRpe,
    hasHeartRate: !!session.metrics?.avgHeartRate,
  };
}

// ============ Insight generation ============

/** Compare this session to the same workout's recent history. */
export function getSessionInsights(
  session: WorkoutSession,
  allSessions: WorkoutSession[],
  allScheduleEntries: ScheduleEntry[],
): Insight[] {
  const snap = computeSessionSnapshot(session);
  const insights: Insight[] = [];

  // ---------- Completion insight ----------
  if (snap.plannedSets > 0) {
    if (snap.completionPct >= 95) {
      insights.push({
        id: nextId(),
        category: 'training',
        severity: 'info',
        title: 'Full session completed',
        rationale:
          'Execution quality was strong enough to keep progression decisions straightforward. Keep core movement selection stable and progress load or reps gradually next session.',
        actions: ['Add 2.5–5 lbs to top compound next session if RPE ≤ 8.'],
        evidence: {
          source: 'session',
          label: 'Completed sets',
          value: `${snap.completedSets}/${snap.plannedSets} sets`,
          date: session.completedAt || session.startedAt,
        },
      });
    } else if (snap.completionPct >= 70) {
      insights.push({
        id: nextId(),
        category: 'training',
        severity: 'attention',
        title: 'Partial completion',
        rationale:
          'You completed most of the plan but stopped short. Likely fatigue, time, or load — re-evaluate the last block before next session.',
        actions: ['Consider deloading the last block by 5–10% next week.'],
        evidence: {
          source: 'session',
          label: 'Completed sets',
          value: `${snap.completedSets}/${snap.plannedSets} sets (${snap.completionPct}%)`,
          date: session.completedAt || session.startedAt,
        },
      });
    } else {
      insights.push({
        id: nextId(),
        category: 'training',
        severity: 'urgent',
        title: 'Session cut short',
        rationale:
          'A large portion of planned work was missed. Don’t progress load next session — repeat at the same prescription and focus on completion.',
        evidence: {
          source: 'session',
          label: 'Completed sets',
          value: `${snap.completedSets}/${snap.plannedSets} sets (${snap.completionPct}%)`,
          date: session.completedAt || session.startedAt,
        },
      });
    }
  }

  // ---------- Volume trend vs prior same-workout sessions ----------
  const priorSameWorkout = allSessions
    .filter(
      (s) =>
        s.id !== session.id &&
        s.workoutId === session.workoutId &&
        s.status === 'completed' &&
        new Date(s.startedAt) < new Date(session.startedAt),
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 3);

  if (priorSameWorkout.length > 0 && snap.totalVolume > 0) {
    const priorVolumes = priorSameWorkout.map((s) => computeSessionSnapshot(s).totalVolume);
    const avgPrior = priorVolumes.reduce((a, b) => a + b, 0) / priorVolumes.length;
    const delta = snap.totalVolume - avgPrior;
    const pct = avgPrior > 0 ? (delta / avgPrior) * 100 : 0;

    if (Math.abs(pct) >= 3) {
      insights.push({
        id: nextId(),
        category: 'training',
        severity: pct >= 0 ? 'info' : 'attention',
        title: pct >= 0 ? 'Volume trending up' : 'Volume below recent average',
        rationale:
          pct >= 0
            ? `Total work was ${pct.toFixed(1)}% above your recent average for this session. Sustainable progressive overload.`
            : `Total work was ${Math.abs(pct).toFixed(1)}% below your recent average for this session. Check sleep, food, or stress before next attempt.`,
        evidence: {
          source: 'session',
          label: 'Session volume vs last 3',
          value: `${snap.totalVolume.toLocaleString()} lbs vs ${Math.round(avgPrior).toLocaleString()} avg`,
          date: session.startedAt,
        },
      });
    }
  }

  // ---------- RPE / effort insight ----------
  const rpe = session.metrics?.rpe;
  if (rpe !== undefined) {
    if (rpe >= 9) {
      insights.push({
        id: nextId(),
        category: 'lifestyle',
        severity: 'attention',
        title: 'High perceived effort',
        rationale:
          'Session effort was at the top of your scale. Prioritise recovery: sleep, hydration, and protein in the next 24 h. Avoid stacking another high-RPE session tomorrow.',
        evidence: {
          source: 'session',
          label: 'Reported RPE',
          value: `${rpe}/10`,
          date: session.completedAt || session.startedAt,
        },
      });
    } else if (rpe <= 5 && snap.completionPct >= 95) {
      insights.push({
        id: nextId(),
        category: 'training',
        severity: 'info',
        title: 'Room to add intensity',
        rationale:
          'You completed every set with low perceived effort. The next session can absorb a small load increase or one extra working set on the main lift.',
        actions: ['Add 2.5–5 lbs to the top compound next session.'],
        evidence: {
          source: 'session',
          label: 'Reported RPE',
          value: `${rpe}/10`,
          date: session.completedAt || session.startedAt,
        },
      });
    }
  }

  // ---------- Schedule alignment ----------
  const overdueScheduled = allScheduleEntries.filter(
    (e) =>
      e.status === 'scheduled' &&
      new Date(e.date) < new Date(session.startedAt.slice(0, 10)),
  ).length;

  if (overdueScheduled === 0 && snap.completionPct >= 95) {
    insights.push({
      id: nextId(),
      category: 'schedule',
      severity: 'info',
      title: 'Schedule aligned',
      rationale: 'No overdue scheduled sessions. Calendar and execution are in sync — keep cadence stable.',
      evidence: {
        source: 'schedule',
        label: 'Overdue scheduled entries',
        value: '0 entries',
        date: session.startedAt,
      },
    });
  } else if (overdueScheduled >= 2) {
    insights.push({
      id: nextId(),
      category: 'schedule',
      severity: 'attention',
      title: 'Schedule drifting',
      rationale:
        'Multiple scheduled sessions were missed before this one. Reassess weekly frequency or shift training days to a more realistic pattern.',
      evidence: {
        source: 'schedule',
        label: 'Overdue scheduled entries',
        value: `${overdueScheduled} entries`,
        date: session.startedAt,
      },
    });
  }

  return insights;
}

// ============ Input quality (UI checklist) ============

export interface InsightInputQuality {
  loggedSets: number;
  completedSets: number;
  rpePresent: boolean;
  heartRatePresent: boolean;
}

export function getInputQuality(session: WorkoutSession): InsightInputQuality {
  let logged = 0;
  let completed = 0;
  let rpePresent = false;
  for (const ex of session.exercises) {
    for (const set of ex.actualSets) {
      logged += 1;
      if (set.completed) completed += 1;
      if (set.rpe !== undefined && set.rpe !== null) rpePresent = true;
    }
  }
  return {
    loggedSets: logged,
    completedSets: completed,
    rpePresent,
    heartRatePresent: !!session.metrics?.avgHeartRate,
  };
}
