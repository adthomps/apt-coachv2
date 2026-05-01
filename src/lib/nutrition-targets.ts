/**
 * APT Nutrition Target Engine
 * Derives daily macro targets from body composition data.
 * All mass values in pounds (lbs).
 */

import type { Snapshot, ProgressCompare, NutritionTargets } from '@/lib/api/types';

/** Katch-McArdle BMR from lean mass (lbs → kg internally). */
function estimateBMR(leanMassLbs: number): number {
  const leanKg = leanMassLbs * 0.453592;
  return 370 + 21.6 * leanKg;
}

/**
 * Compute daily nutrition targets grounded in the latest body composition.
 * Activity multiplier defaults to 1.55 (moderate — 3-5 days/week training).
 */
export function computeNutritionTargets(
  snapshot: Snapshot,
  compare?: ProgressCompare,
  activityMultiplier = 1.55,
): NutritionTargets {
  const { leanMass, bodyFatPercentage, fatMass } = snapshot.bodyComposition;

  // --- Protein: 1g per lb lean mass ---
  const protein = Math.round(leanMass);

  // --- TDEE ---
  const bmr = estimateBMR(leanMass);
  let tdee = Math.round(bmr * activityMultiplier);

  // Adjust for current trend
  let adjustment = '';
  if (compare) {
    const fatDelta = compare.changes.fatMass.value;
    const leanDelta = compare.changes.leanMass.value;

    if (fatDelta > 1.0 && leanDelta >= 0) {
      // Gaining fat — slight deficit
      tdee -= 200;
      adjustment = 'Mild deficit (-200 kcal) — fat mass trending up while preserving lean gains.';
    } else if (leanDelta > 0.5 && fatDelta <= 0) {
      // Great recomp — slight surplus on training days
      tdee += 150;
      adjustment = 'Slight surplus (+150 kcal) — supporting lean mass growth with minimal fat gain.';
    } else if (leanDelta < -0.5) {
      // Losing muscle — increase intake
      tdee += 250;
      adjustment = 'Surplus (+250 kcal) — lean mass declining, increase intake to preserve muscle.';
    }
  }

  const calories = tdee;

  // --- Carbs & Fat split ---
  // Lower body-fat → more carbs; higher body-fat → more fats for satiety
  const proteinCals = protein * 4;
  const remaining = Math.max(calories - proteinCals, 400);

  let carbRatio: number;
  if (bodyFatPercentage < 15) {
    carbRatio = 0.65;
  } else if (bodyFatPercentage < 22) {
    carbRatio = 0.55;
  } else {
    carbRatio = 0.40;
  }

  const carbs = Math.round((remaining * carbRatio) / 4);
  const fat = Math.round((remaining * (1 - carbRatio)) / 9);

  const reasoning = [
    `Protein: ${protein}g (1g/lb lean mass at ${leanMass.toFixed(0)} lbs).`,
    `TDEE: ~${tdee} kcal (BMR ${Math.round(bmr)} × ${activityMultiplier} activity).`,
    adjustment || 'Maintenance — body composition trending steady.',
    `Carb/fat split: ${Math.round(carbRatio * 100)}/${Math.round((1 - carbRatio) * 100)} based on ${bodyFatPercentage.toFixed(1)}% body fat.`,
  ].join(' ');

  return { calories, protein, carbs, fat, source: 'protocol', reasoning };
}
