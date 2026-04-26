/**
 * APT Protocol — Client-side mock recommendation engine
 * Takes Snapshot + ProgressCompare data and produces coaching recommendations
 * All mass values in pounds (lbs)
 */

import type { Snapshot, ProgressCompare, Recommendation, FoodSuggestion } from '@/lib/api/types';

function getFoodSuggestions(snapshot: Snapshot, compare?: ProgressCompare): FoodSuggestion[] {
  const bf = snapshot.bodyComposition.bodyFatPercentage;
  const suggestions: FoodSuggestion[] = [];

  // Protein target: ~1g per lb of lean mass (values already in lbs)
  suggestions.push({
    title: 'Hit your protein target',
    description: `Aim for ${Math.round(snapshot.bodyComposition.leanMass)} g/day (1g per lb of lean mass). Prioritize whole sources: chicken, fish, eggs, Greek yogurt.`,
    category: 'protein',
  });

  if (compare && compare.changes.leanMass.value > 0) {
    suggestions.push({
      title: 'Lean mass is trending up — fuel it',
      description: 'Keep a slight caloric surplus on training days (+200-300 kcal). Focus on complex carbs around workouts.',
      category: 'carb',
    });
  }

  if (bf > 18) {
    suggestions.push({
      title: 'Reduce processed carbs',
      description: 'Swap refined grains for whole grains, sweet potatoes, and legumes. Keep total carbs moderate on rest days.',
      category: 'carb',
    });
    suggestions.push({
      title: 'Add healthy fats strategically',
      description: 'Include avocado, olive oil, and nuts. Fat keeps you satiated while in a mild deficit.',
      category: 'fat',
    });
  } else {
    suggestions.push({
      title: 'Carb-time around training',
      description: 'Place 60-70% of daily carbs in the pre- and post-workout window for performance and recovery.',
      category: 'timing',
    });
  }

  if (compare && compare.changes.fatMass.value < -1.0) {
    suggestions.push({
      title: 'Fat loss is working — stay the course',
      description: 'Don\'t cut calories further yet. Maintain current intake and monitor for 2-3 more weeks.',
      category: 'timing',
    });
  } else if (compare && compare.changes.fatMass.value > 1.0) {
    suggestions.push({
      title: 'Fat gain detected — tighten up',
      description: 'Reduce daily intake by 100-200 kcal. Focus on eliminating liquid calories and late-night snacking.',
      category: 'timing',
    });
  }

  return suggestions.slice(0, 5);
}

export function getRecommendation(
  latestSnapshot: Snapshot,
  compare?: ProgressCompare,
  currentProgramName?: string
): Recommendation {
  const bf = latestSnapshot.bodyComposition.bodyFatPercentage;
  const foodSuggestions = getFoodSuggestions(latestSnapshot, compare);

  // If no comparison data yet, recommend starting a program
  if (!compare) {
    return {
      action: 'generate',
      reasoning: 'This is your first snapshot. We recommend starting with an Upper/Lower split focused on recomposition to build a baseline.',
      foodSuggestions,
    };
  }

  const leanGain = compare.changes.leanMass.value;
  const fatLoss = compare.changes.fatMass.value;

  // Great recomp: gaining lean, losing fat (values in lbs, ~1 lb threshold)
  if (leanGain > 1.0 && fatLoss < -0.5) {
    return {
      action: 'continue',
      programName: currentProgramName || 'Current Program',
      reasoning: `Excellent recomposition progress! You've gained ${leanGain.toFixed(1)} lbs of lean mass and lost ${Math.abs(fatLoss).toFixed(1)} lbs of fat over ${compare.timeSpanDays} days. Stay on your current program.`,
      foodSuggestions,
    };
  }

  // Gaining lean but also gaining fat — switch to cut-oriented
  if (leanGain > 0 && fatLoss > 1.0) {
    return {
      action: 'switch',
      reasoning: `You've built ${leanGain.toFixed(1)} lbs of lean mass, but also gained ${fatLoss.toFixed(1)} lbs of fat. Consider switching to a strength-maintenance program with a mild caloric deficit to shed excess fat while preserving gains.`,
      foodSuggestions,
    };
  }

  // Losing lean mass — need to eat more and train differently
  if (leanGain < -0.5) {
    return {
      action: 'generate',
      reasoning: `You've lost ${Math.abs(leanGain).toFixed(1)} lbs of lean mass. This may indicate under-eating or insufficient training stimulus. We recommend a new hypertrophy-focused program with adequate caloric support.`,
      foodSuggestions,
    };
  }

  // Default: moderate progress, continue
  return {
    action: 'continue',
    programName: currentProgramName || 'Current Program',
    reasoning: `Steady progress over the last ${compare.timeSpanDays} days. Body fat is at ${bf.toFixed(1)}%. Continue your current approach and re-scan in 8-12 weeks.`,
    foodSuggestions,
  };
}