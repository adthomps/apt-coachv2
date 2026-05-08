/**
 * APT Nutrition Target Engine
 * Derives daily macro targets from body composition data, then applies an
 * optional NutritionGoal (phase + activity multiplier + per-macro overrides).
 * All mass values in pounds (lbs).
 */

import type {
  Snapshot, ProgressCompare, NutritionTargets, NutritionGoal, GoalPhase,
} from '@/lib/api/types';
import { GOAL_PHASE_DELTA, GOAL_PHASE_LABELS } from '@/lib/api/types';

const DEFAULT_ACTIVITY = 1.55;

/** Katch-McArdle BMR from lean mass (lbs → kg internally). */
function estimateBMR(leanMassLbs: number): number {
  const leanKg = leanMassLbs * 0.453592;
  return 370 + 21.6 * leanKg;
}

function carbRatioFor(bodyFatPercentage: number): number {
  if (bodyFatPercentage < 15) return 0.65;
  if (bodyFatPercentage < 22) return 0.55;
  return 0.40;
}

function trendNudge(compare?: ProgressCompare): { delta: number; note: string } {
  if (!compare) return { delta: 0, note: '' };
  const fatDelta = compare.changes.fatMass.value;
  const leanDelta = compare.changes.leanMass.value;
  if (fatDelta > 1.0 && leanDelta >= 0) {
    return { delta: -200, note: 'Trend nudge -200 kcal — fat trending up.' };
  }
  if (leanDelta > 0.5 && fatDelta <= 0) {
    return { delta: 150, note: 'Trend nudge +150 kcal — clean lean gain.' };
  }
  if (leanDelta < -0.5) {
    return { delta: 250, note: 'Trend nudge +250 kcal — preserving lean mass.' };
  }
  return { delta: 0, note: '' };
}

function splitMacros(calories: number, protein: number, bodyFatPercentage: number) {
  const proteinCals = protein * 4;
  const remaining = Math.max(calories - proteinCals, 400);
  const ratio = carbRatioFor(bodyFatPercentage);
  return {
    carbs: Math.round((remaining * ratio) / 4),
    fat: Math.round((remaining * (1 - ratio)) / 9),
    ratio,
  };
}

/**
 * Compute daily nutrition targets grounded in the latest body composition,
 * with optional goal applying phase + activity + per-macro overrides.
 */
export function computeNutritionTargets(
  snapshot: Snapshot,
  compare?: ProgressCompare,
  goal?: NutritionGoal,
): NutritionTargets {
  const { leanMass, bodyFatPercentage } = snapshot.bodyComposition;

  const phase: GoalPhase = goal?.phase ?? 'maintain';
  const activity = goal?.activityMultiplier ?? DEFAULT_ACTIVITY;

  // --- Auto baseline (uses default activity, no phase, includes trend nudge) ---
  const baseProtein = Math.round(leanMass);
  const baseBmr = estimateBMR(leanMass);
  const baseTrend = trendNudge(compare);
  const baseCalories = Math.round(baseBmr * DEFAULT_ACTIVITY) + baseTrend.delta;
  const baseSplit = splitMacros(baseCalories, baseProtein, bodyFatPercentage);
  const autoBaseline = {
    calories: baseCalories,
    protein: baseProtein,
    carbs: baseSplit.carbs,
    fat: baseSplit.fat,
  };

  // --- Goal-adjusted target ---
  const protein = Math.round(leanMass);
  const bmr = estimateBMR(leanMass);
  const phaseDelta = GOAL_PHASE_DELTA[phase];
  // Phase delta replaces the trend nudge; we only keep the trend nudge on Maintain.
  const trend = phase === 'maintain' ? trendNudge(compare) : { delta: 0, note: '' };
  let calories = Math.round(bmr * activity) + phaseDelta + trend.delta;
  let split = splitMacros(calories, protein, bodyFatPercentage);
  let carbs = split.carbs;
  let fat = split.fat;

  // --- Apply overrides last ---
  const ov = goal?.overrides ?? {};
  const overridden = {
    calories: ov.calories != null,
    protein: ov.protein != null,
    carbs: ov.carbs != null,
    fat: ov.fat != null,
  };

  const finalProtein = overridden.protein ? ov.protein! : protein;
  // If calories overridden, recompute split unless carbs/fat also overridden
  if (overridden.calories) {
    calories = ov.calories!;
    if (!overridden.carbs || !overridden.fat) {
      split = splitMacros(calories, finalProtein, bodyFatPercentage);
      carbs = split.carbs;
      fat = split.fat;
    }
  } else if (overridden.protein) {
    split = splitMacros(calories, finalProtein, bodyFatPercentage);
    carbs = split.carbs;
    fat = split.fat;
  }
  if (overridden.carbs) carbs = ov.carbs!;
  if (overridden.fat) fat = ov.fat!;

  const anyOverride = overridden.calories || overridden.protein || overridden.carbs || overridden.fat;
  const source: NutritionTargets['source'] = anyOverride
    ? 'overridden'
    : phase === 'maintain' && !goal
      ? 'auto'
      : 'phase_adjusted';

  const phaseLine = phase === 'maintain' && phaseDelta === 0
    ? trend.note || 'Maintenance — body composition steady.'
    : `${GOAL_PHASE_LABELS[phase]} (${phaseDelta >= 0 ? '+' : ''}${phaseDelta} kcal vs TDEE).`;

  const overrideParts: string[] = [];
  if (overridden.calories) overrideParts.push(`calories ${ov.calories}`);
  if (overridden.protein) overrideParts.push(`protein ${ov.protein}g`);
  if (overridden.carbs) overrideParts.push(`carbs ${ov.carbs}g`);
  if (overridden.fat) overrideParts.push(`fat ${ov.fat}g`);

  const reasoning = [
    `Protein: ${finalProtein}g (1g/lb of ${leanMass.toFixed(0)} lbs lean mass).`,
    `TDEE: ~${Math.round(bmr * activity)} kcal (BMR ${Math.round(bmr)} × ${activity} activity).`,
    phaseLine,
    `Carb/fat split: ${Math.round(split.ratio * 100)}/${Math.round((1 - split.ratio) * 100)} from ${bodyFatPercentage.toFixed(1)}% body fat.`,
    overrideParts.length ? `Manual overrides: ${overrideParts.join(', ')}.` : '',
  ].filter(Boolean).join(' ');

  return {
    calories,
    protein: finalProtein,
    carbs,
    fat,
    source,
    reasoning,
    phase,
    activityMultiplier: activity,
    autoBaseline,
    overridden,
  };
}

/** Default targets when no snapshot exists. */
export function defaultTargets(): NutritionTargets {
  return {
    calories: 2400, protein: 180, carbs: 250, fat: 80,
    source: 'custom',
    reasoning: 'No body composition data — using default targets. Import a DEXA scan for personalized recommendations.',
    phase: 'maintain',
    activityMultiplier: DEFAULT_ACTIVITY,
    autoBaseline: { calories: 2400, protein: 180, carbs: 250, fat: 80 },
    overridden: { calories: false, protein: false, carbs: false, fat: false },
  };
}
