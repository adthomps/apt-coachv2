/**
 * APT Adaptive Training Engine — Deterministic Rule System
 * Analyzes training performance, adherence, and body composition
 * to produce structured coaching recommendations.
 * All weight values in pounds (lbs).
 */

import type {
  WorkoutSession,
  ExercisePerformanceProfile,
  AdaptiveRecommendation,
  ScheduleEntry,
  Snapshot,
  ProgressCompare,
} from '@/lib/api/types';

let recIdCounter = 0;
function makeRecId(): string {
  return `arec_${Date.now()}_${++recIdCounter}`;
}

// ============ Strength Progression Rules ============

function evaluateStrengthProgression(
  profile: ExercisePerformanceProfile
): AdaptiveRecommendation[] {
  const recs: AdaptiveRecommendation[] = [];
  const history = profile.sessionHistory;
  if (history.length < 2) return recs;

  const recent3 = history.slice(0, 3);

  // Rule: Target reps achieved for 3 consecutive sessions → increase weight 2.5–5%
  if (recent3.length >= 3) {
    const allHitTarget = recent3.every(s => s.avgReps >= profile.recentAverageReps);
    if (allHitTarget && profile.progressionState === 'progressing') {
      const bump = Math.round(profile.lastWeight * 0.025 / 2.5) * 2.5 || 5;
      const suggested = profile.lastWeight + bump;
      recs.push({
        id: makeRecId(),
        type: 'weight_progression',
        targetExerciseId: profile.exerciseId,
        targetExerciseName: profile.exerciseName,
        suggestedWeight: suggested,
        rationale: `You've hit your rep targets for 3 consecutive sessions at ${profile.lastWeight} lbs. Time to bump up to ${suggested} lbs.`,
        confidenceScore: 0.85,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Rule: Weight unchanged across 4 sessions AND reps declining → deload
  if (history.length >= 4) {
    const recent4 = history.slice(0, 4);
    const sameWeight = recent4.every(s => s.weight === recent4[0].weight);
    const repsTrending = recent4[0].avgReps < recent4[3].avgReps;
    if (sameWeight && repsTrending) {
      const deloadWeight = Math.round(profile.lastWeight * 0.9 / 2.5) * 2.5;
      recs.push({
        id: makeRecId(),
        type: 'weight_progression',
        targetExerciseId: profile.exerciseId,
        targetExerciseName: profile.exerciseName,
        suggestedWeight: deloadWeight,
        rationale: `${profile.exerciseName} has stalled at ${profile.lastWeight} lbs with declining reps. Consider a deload to ${deloadWeight} lbs and build back up.`,
        confidenceScore: 0.75,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Rule: Consistent overperformance → weight bump
  if (recent3.length >= 2) {
    const overperforming = recent3.every(s => s.avgReps > profile.recentAverageReps + 2);
    if (overperforming) {
      const bump = Math.round(profile.lastWeight * 0.05 / 2.5) * 2.5 || 5;
      recs.push({
        id: makeRecId(),
        type: 'weight_progression',
        targetExerciseId: profile.exerciseId,
        targetExerciseName: profile.exerciseName,
        suggestedWeight: profile.lastWeight + bump,
        rationale: `You're consistently exceeding rep targets on ${profile.exerciseName}. The weight is too light — increase by ${bump} lbs.`,
        confidenceScore: 0.8,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return recs;
}

// ============ Volume Rules ============

function evaluateVolumeFromSession(
  session: WorkoutSession
): AdaptiveRecommendation[] {
  const recs: AdaptiveRecommendation[] = [];

  for (const ex of session.exercises) {
    const completedSets = ex.actualSets.filter(s => s.completed).length;
    const ratio = completedSets / ex.plannedSets;

    if (ratio < 0.8 && ex.plannedSets > 2) {
      recs.push({
        id: makeRecId(),
        type: 'volume_adjustment',
        targetExerciseId: ex.exerciseId,
        targetExerciseName: ex.exerciseName,
        suggestedSets: Math.max(2, ex.plannedSets - 1),
        rationale: `You only completed ${completedSets}/${ex.plannedSets} sets on ${ex.exerciseName}. Consider reducing to ${Math.max(2, ex.plannedSets - 1)} sets until consistency improves.`,
        confidenceScore: 0.7,
        createdAt: new Date().toISOString(),
      });
    }

    // All sets completed with low RPE → add volume
    const allCompleted = completedSets === ex.plannedSets;
    const avgRpe = ex.actualSets.filter(s => s.rpe).reduce((sum, s) => sum + (s.rpe || 0), 0) / (ex.actualSets.filter(s => s.rpe).length || 1);
    if (allCompleted && avgRpe > 0 && avgRpe < 7) {
      recs.push({
        id: makeRecId(),
        type: 'volume_adjustment',
        targetExerciseId: ex.exerciseId,
        targetExerciseName: ex.exerciseName,
        suggestedSets: ex.plannedSets + 1,
        rationale: `${ex.exerciseName} felt easy (avg RPE ${avgRpe.toFixed(1)}). You can handle an extra set — try ${ex.plannedSets + 1} sets next time.`,
        confidenceScore: 0.65,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return recs;
}

// ============ Adherence Rules ============

export function evaluateSchedule(
  entries: ScheduleEntry[]
): AdaptiveRecommendation[] {
  const recs: AdaptiveRecommendation[] = [];
  if (entries.length === 0) return recs;

  // Look at last 3 weeks of data
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  const recent = entries.filter(e => new Date(e.date) >= threeWeeksAgo);

  if (recent.length === 0) return recs;

  const skipped = recent.filter(e => e.status === 'skipped').length;
  const skipRate = skipped / recent.length;

  if (skipRate > 0.4) {
    recs.push({
      id: makeRecId(),
      type: 'schedule_optimization',
      scheduleAdjustment: 'reduce_frequency',
      rationale: `You've skipped ${skipped} out of ${recent.length} scheduled workouts (${Math.round(skipRate * 100)}%) in the last 3 weeks. Consider reducing to 3 days per week to build consistency.`,
      confidenceScore: 0.8,
      createdAt: new Date().toISOString(),
    });
  } else if (skipRate > 0.2) {
    recs.push({
      id: makeRecId(),
      type: 'schedule_optimization',
      scheduleAdjustment: 'adjust_days',
      rationale: `You've missed ${skipped} workouts recently. Look at which days you're skipping — you may need to shift your training days.`,
      confidenceScore: 0.6,
      createdAt: new Date().toISOString(),
    });
  }

  // Check for pattern of skipping specific days
  const skippedDays = recent
    .filter(e => e.status === 'skipped')
    .map(e => new Date(e.date).getDay());
  const dayCount: Record<number, number> = {};
  skippedDays.forEach(d => { dayCount[d] = (dayCount[d] || 0) + 1; });
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const [day, count] of Object.entries(dayCount)) {
    if (count >= 2) {
      recs.push({
        id: makeRecId(),
        type: 'schedule_optimization',
        scheduleAdjustment: `move_from_${dayNames[parseInt(day)].toLowerCase()}`,
        rationale: `You've skipped ${count} workouts on ${dayNames[parseInt(day)]}s. Consider moving that session to a different day.`,
        confidenceScore: 0.7,
        createdAt: new Date().toISOString(),
      });
      break; // Only report the worst day
    }
  }

  return recs;
}

// ============ Body Composition Influence Rules ============

export function evaluateSnapshot(
  snapshot: Snapshot,
  compare: ProgressCompare,
  profiles: ExercisePerformanceProfile[]
): AdaptiveRecommendation[] {
  const recs: AdaptiveRecommendation[] = [];
  const { fatMass, leanMass } = compare.changes;

  // Fat decreasing + lean stable/increasing → maintain
  if (fatMass.value < -0.5 && leanMass.value >= -0.3) {
    recs.push({
      id: makeRecId(),
      type: 'training_insight',
      rationale: `Great recomposition: you've lost ${Math.abs(fatMass.value).toFixed(1)} lbs of fat while maintaining lean mass over ${compare.timeSpanDays} days. Keep your current program structure.`,
      confidenceScore: 0.9,
      createdAt: new Date().toISOString(),
    });
  }

  // Lean decreasing + weight decreasing → increase resistance emphasis
  if (leanMass.value < -1.0 && compare.changes.totalMass.value < 0) {
    recs.push({
      id: makeRecId(),
      type: 'program_adjustment',
      rationale: `You've lost ${Math.abs(leanMass.value).toFixed(1)} lbs of lean mass while cutting weight. Increase training intensity and reduce conditioning volume to preserve muscle.`,
      confidenceScore: 0.85,
      createdAt: new Date().toISOString(),
    });
    recs.push({
      id: makeRecId(),
      type: 'food_guidance',
      foodSuggestion: `Increase protein to ${Math.round(snapshot.bodyComposition.leanMass * 1.2)}g/day and add 200 kcal on training days to halt lean mass loss.`,
      rationale: 'Lean mass loss while in a deficit suggests insufficient protein or calories around training.',
      confidenceScore: 0.8,
      createdAt: new Date().toISOString(),
    });
  }

  // Strength improving but fat not decreasing → density/food adjustment
  const anyProgressing = profiles.some(p => p.progressionState === 'progressing');
  if (anyProgressing && fatMass.value > 0.5) {
    recs.push({
      id: makeRecId(),
      type: 'food_guidance',
      foodSuggestion: 'Strength is improving but fat mass is increasing. Tighten daily intake by 150-200 kcal or add 10 min of conditioning post-workout.',
      rationale: `You're getting stronger but added ${fatMass.value.toFixed(1)} lbs of fat. A small caloric adjustment can keep recomposition on track.`,
      confidenceScore: 0.75,
      createdAt: new Date().toISOString(),
    });
  }

  // Body comp trending positively → stay course
  if (leanMass.value > 1.0 && fatMass.value <= 0) {
    recs.push({
      id: makeRecId(),
      type: 'training_insight',
      rationale: `Excellent progress: +${leanMass.value.toFixed(1)} lbs lean mass and ${fatMass.value.toFixed(1)} lbs fat change. Focus on progressive overload and keep nutrition consistent.`,
      confidenceScore: 0.9,
      createdAt: new Date().toISOString(),
    });
  }

  return recs;
}

// ============ Session Evaluation (combines strength + volume) ============

export function evaluateSession(
  session: WorkoutSession,
  profiles: ExercisePerformanceProfile[]
): AdaptiveRecommendation[] {
  const recs: AdaptiveRecommendation[] = [];

  // Evaluate strength progression per exercise
  for (const ex of session.exercises) {
    const profile = profiles.find(p => p.exerciseId === ex.exerciseId);
    if (profile) {
      recs.push(...evaluateStrengthProgression(profile));
    }
  }

  // Evaluate volume
  recs.push(...evaluateVolumeFromSession(session));

  return recs;
}

// ============ Insight Summary ============

export function getInsightSummary(
  recommendations: AdaptiveRecommendation[]
): string {
  if (recommendations.length === 0) return 'No new insights. Keep training consistently.';

  const insights: string[] = [];
  const byType = new Map<string, AdaptiveRecommendation[]>();
  for (const r of recommendations) {
    const list = byType.get(r.type) || [];
    list.push(r);
    byType.set(r.type, list);
  }

  const weightRecs = byType.get('weight_progression') || [];
  if (weightRecs.length > 0) {
    const names = weightRecs.map(r => r.targetExerciseName).filter(Boolean).join(', ');
    insights.push(`Weight adjustments suggested for: ${names}.`);
  }

  const volumeRecs = byType.get('volume_adjustment') || [];
  if (volumeRecs.length > 0) {
    insights.push(`Volume tweaks recommended for ${volumeRecs.length} exercise(s).`);
  }

  const schedRecs = byType.get('schedule_optimization') || [];
  if (schedRecs.length > 0) {
    insights.push('Your training schedule could use adjustment based on recent adherence.');
  }

  const bodyRecs = byType.get('training_insight') || [];
  if (bodyRecs.length > 0) {
    insights.push(bodyRecs[0].rationale);
  }

  const foodRecs = byType.get('food_guidance') || [];
  if (foodRecs.length > 0) {
    insights.push('Nutrition adjustments available based on your body composition trends.');
  }

  return insights.join(' ');
}
