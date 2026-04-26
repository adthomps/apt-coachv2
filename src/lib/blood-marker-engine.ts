/**
 * APT Blood Marker Adaptive Engine
 * Deterministic rules that produce AdaptiveRecommendation[] from blood panel data.
 * All thresholds based on standard clinical ranges and fitness-oriented guidelines.
 */

import type { BloodPanel, BloodMarker, AdaptiveRecommendation } from '@/lib/api/types';

let bloodRecCounter = 0;
function makeBloodRecId(): string {
  return `brec_${Date.now()}_${++bloodRecCounter}`;
}

function findMarker(markers: BloodMarker[], name: string): BloodMarker | undefined {
  return markers.find(m => m.marker.toLowerCase().includes(name.toLowerCase()));
}

function makeRec(
  type: AdaptiveRecommendation['type'],
  rationale: string,
  confidence: number,
  foodSuggestion?: string,
): AdaptiveRecommendation {
  return {
    id: makeBloodRecId(),
    type,
    rationale,
    confidenceScore: confidence,
    foodSuggestion,
    createdAt: new Date().toISOString(),
  };
}

export function evaluateBloodPanel(panel: BloodPanel): AdaptiveRecommendation[] {
  const recs: AdaptiveRecommendation[] = [];
  const { markers } = panel;

  // ApoB > 90
  const apoB = findMarker(markers, 'ApoB');
  if (apoB && apoB.value > 90) {
    recs.push(makeRec(
      'food_guidance',
      `ApoB is elevated at ${apoB.value} ${apoB.unit}. Reduce saturated fat, increase soluble fiber (oats, beans). Consider omega-3 supplementation.`,
      0.85,
      'Reduce saturated fat intake. Add 10g+ soluble fiber daily (oats, psyllium, beans). Consider 2-4g EPA/DHA omega-3.',
    ));
  }

  // HDL < 40
  const hdl = findMarker(markers, 'HDL Cholesterol');
  if (hdl && hdl.value < 40) {
    recs.push(makeRec(
      'food_guidance',
      `HDL is low at ${hdl.value} ${hdl.unit}. Increase aerobic conditioning (20-30 min, 3x/week). Add olive oil, nuts, fatty fish.`,
      0.85,
      'Add 2 tbsp olive oil daily, handful of nuts, and 2-3 servings fatty fish per week.',
    ));
    recs.push(makeRec(
      'training_insight',
      `Low HDL (${hdl.value} ${hdl.unit}) responds well to regular cardio. Add 20-30 min moderate-intensity conditioning 3x/week.`,
      0.75,
    ));
  }

  // Triglycerides > 149
  const tg = findMarker(markers, 'Triglycerides');
  if (tg && !tg.marker.includes('Ratio') && tg.value > 149) {
    recs.push(makeRec(
      'food_guidance',
      `Triglycerides elevated at ${tg.value} ${tg.unit}. Reduce refined carbs and alcohol. Increase omega-3 intake.`,
      0.8,
      'Cut refined sugars and processed carbs. Limit alcohol. Add omega-3 rich foods or supplement 2-4g EPA/DHA daily.',
    ));
  }

  // TG/HDL ratio > 2.5
  const tgHdlRatio = findMarker(markers, 'Triglycerides/HDL Ratio');
  if (tgHdlRatio && tgHdlRatio.value > 2.5) {
    recs.push(makeRec(
      'blood_marker_insight',
      `TG/HDL ratio of ${tgHdlRatio.value} suggests insulin resistance risk. Prioritize resistance training and reduce simple carbs.`,
      0.8,
    ));
  }

  // Total Testosterone < 300
  const totalT = findMarker(markers, 'Total Testosterone');
  if (totalT && totalT.value < 300) {
    recs.push(makeRec(
      'training_insight',
      `Total testosterone is low-average at ${totalT.value} ${totalT.unit}. Prioritize compound lifts (squat, deadlift, press), ensure 7-9 hrs sleep, check zinc/magnesium adequacy.`,
      0.75,
    ));
    recs.push(makeRec(
      'food_guidance',
      `Low-average testosterone (${totalT.value} ${totalT.unit}). Ensure adequate dietary fat (25-35% of calories), zinc-rich foods (red meat, pumpkin seeds), and magnesium.`,
      0.7,
      'Include zinc-rich foods (oysters, red meat, pumpkin seeds) and magnesium (dark leafy greens, nuts). Ensure 25-35% of calories from fat.',
    ));
  }

  // Vitamin D < 40
  const vitD = findMarker(markers, 'Vitamin D');
  if (vitD && vitD.value < 40) {
    recs.push(makeRec(
      'food_guidance',
      `Vitamin D at ${vitD.value} ${vitD.unit} is suboptimal for athletic performance. Supplement 2000-4000 IU/day with a fat-containing meal.`,
      0.8,
      'Supplement Vitamin D3 2000-4000 IU daily with a meal containing fat for absorption.',
    ));
  }

  // hs-CRP > 1.0
  const crp = findMarker(markers, 'hs-CRP');
  if (crp && crp.value > 1.0) {
    recs.push(makeRec(
      'blood_marker_insight',
      `hs-CRP at ${crp.value} ${crp.unit} indicates moderate systemic inflammation. Monitor recovery, avoid overtraining, increase anti-inflammatory foods (berries, turmeric, omega-3).`,
      0.7,
    ));
  }

  // Ferritin > 300
  const ferritin = findMarker(markers, 'Ferritin');
  if (ferritin && ferritin.value > 300) {
    recs.push(makeRec(
      'blood_marker_insight',
      `Ferritin is elevated at ${ferritin.value} ${ferritin.unit}. Very high ferritin can indicate inflammation or iron overload. Monitor and discuss with your provider.`,
      0.6,
    ));
  }

  // Cholesterol/HDL ratio > 5.1
  const cholHdlRatio = findMarker(markers, 'Total Cholesterol/HDL Ratio');
  if (cholHdlRatio && cholHdlRatio.value > 5.1) {
    recs.push(makeRec(
      'blood_marker_insight',
      `Total Cholesterol/HDL ratio of ${cholHdlRatio.value} is elevated (target < 5.1). Focus on improving HDL through exercise and dietary fat quality.`,
      0.75,
    ));
  }

  // Remnant Cholesterol > 24
  const remnant = findMarker(markers, 'Remnant Cholesterol');
  if (remnant && remnant.value > 24) {
    recs.push(makeRec(
      'food_guidance',
      `Remnant cholesterol at ${remnant.value} ${remnant.unit} is elevated. This is driven by triglyceride-rich particles. Reduce refined carbs and increase fiber.`,
      0.7,
      'Reduce refined carbohydrates. Increase soluble fiber and omega-3 fatty acids.',
    ));
  }

  return recs;
}
