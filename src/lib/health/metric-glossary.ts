/**
 * APT Metric Glossary
 *
 * Single source of truth for "what this metric means", "why it matters",
 * and "what to focus on". Used by KpiStat and any health card that wants
 * to surface an expandable explanation. Keeps Dashboard and Health page
 * speaking the same language.
 *
 * Add a new entry here — every surface that references the key picks it up.
 */

export interface MetricExplanation {
  /** Plain-English definition. */
  what: string;
  /** Why it matters for body composition / training / health. */
  why: string;
  /** Concrete focus areas / suggested changes. */
  focus: string[];
  /** Optional canonical reference range or healthy band, free-text. */
  range?: string;
}

export type MetricKey =
  // Body composition
  | 'weight'
  | 'body_fat'
  | 'lean_mass'
  | 'fat_mass'
  | 'lean_mass_ratio'
  // Withings extras
  | 'visceral_fat'
  | 'muscle_mass'
  // Blood markers
  | 'hdl'
  | 'ldl'
  | 'triglycerides'
  | 'tg_hdl_ratio'
  | 'total_testosterone'
  | 'vitamin_d'
  | 'hs_crp'
  | 'a1c'
  | 'glucose'
  | 'tsh'
  | 'ferritin'
  // Adherence
  | 'adherence'
  | 'streak'
  | 'markers_optimal'
  | 'markers_out_of_range'
  // Regional DEXA
  | 'region_arms'
  | 'region_legs'
  | 'region_trunk'
  | 'region_android'
  | 'region_gynoid'
  // Bone density
  | 'bone_t_score'
  | 'bone_z_score'
  // Trend / signals
  | 'weight_trend'
  | 'health_signals'
  | 'panel_summary';

export const METRIC_GLOSSARY: Record<MetricKey, MetricExplanation> = {
  weight: {
    what: 'Total body mass measured at the time of the scan.',
    why: 'Useful as a coarse trend, but lean and fat composition matter more than the number on the scale.',
    focus: ['Track weekly trend, not daily noise', 'Weigh in the same conditions for comparability'],
  },
  body_fat: {
    what: 'Percentage of total body mass that is fat tissue.',
    why: 'A primary marker of body composition. Lower is not always better — very low body fat hurts hormones, recovery, and performance.',
    focus: ['Athletic healthy band: ~10–20%', 'Move it via slow caloric deficit + strength training, not crash diets'],
    range: '10–20% (athletic healthy)',
  },
  lean_mass: {
    what: 'Muscle, bone, organs, and water — everything that is not fat.',
    why: 'Drives strength, metabolic rate, and longevity. Protecting lean mass is the #1 goal in any cut.',
    focus: ['Hit ~0.8–1.0 g protein per lb body weight', 'Keep heavy compound lifts in your week', 'Avoid aggressive deficits (>500 kcal/day)'],
  },
  fat_mass: {
    what: 'Total mass of fat tissue (subcutaneous + visceral).',
    why: 'Going down while lean mass holds = recomposition working. Going up alongside weight = surplus is too high.',
    focus: ['Pair modest deficit with strength training', 'Prioritize protein and fiber to manage hunger'],
  },
  lean_mass_ratio: {
    what: 'Lean mass as a percentage of total body mass.',
    why: 'A composite quality score — rising ratio means body composition is improving regardless of scale weight.',
    focus: ['Optimize via resistance training + adequate protein', 'Watch trend over scans, not a single point'],
  },
  visceral_fat: {
    what: 'Fat stored around abdominal organs (estimated).',
    why: 'Strongest fat-related driver of metabolic and cardiovascular risk. Subcutaneous fat is far less concerning.',
    focus: ['Reduce refined carbs & alcohol', 'Add zone-2 cardio 2–3x/week', 'Sleep 7–9 hours'],
  },
  muscle_mass: {
    what: 'Smart-scale estimate of skeletal muscle mass.',
    why: 'Less precise than DEXA but useful for between-scan trend tracking.',
    focus: ['Use as a directional check, not absolute truth', 'Confirm with periodic DEXA scans'],
  },

  hdl: {
    what: '"Good" cholesterol — helps clear LDL from arteries.',
    why: 'Higher HDL is protective against cardiovascular disease.',
    focus: ['20–30 min aerobic 3x/week raises HDL', 'Add olive oil, nuts, fatty fish'],
    range: '> 40 mg/dL (men), > 50 mg/dL (women)',
  },
  ldl: {
    what: '"Bad" cholesterol — can deposit in artery walls.',
    why: 'Elevated LDL combined with inflammation drives cardiovascular risk.',
    focus: ['Reduce saturated fat from processed sources', 'Add soluble fiber (oats, beans)', 'Discuss with your doctor if persistently high'],
    range: '< 100 mg/dL (optimal)',
  },
  triglycerides: {
    what: 'Fat circulating in your blood from food and liver synthesis.',
    why: 'High triglycerides usually point to too many refined carbs, alcohol, or excess calories.',
    focus: ['Cut refined carbs and alcohol', 'Add omega-3 (fatty fish 2x/week or supplement)'],
    range: '< 100 mg/dL (optimal)',
  },
  tg_hdl_ratio: {
    what: 'Triglycerides divided by HDL — a quick insulin-resistance proxy.',
    why: 'Ratio > 2.5 suggests early insulin resistance, even when individual numbers look fine.',
    focus: ['Prioritize resistance training', 'Reduce simple carbs', 'Improve sleep and stress'],
    range: '< 2.5 (optimal)',
  },
  total_testosterone: {
    what: 'Total circulating testosterone (bound + free).',
    why: 'Drives muscle protein synthesis, recovery, libido, and mood.',
    focus: ['Heavy compound lifts (squat, deadlift, press)', 'Sleep 7–9 hours', 'Adequate dietary fat (25–35% of calories)', 'Check zinc and magnesium intake'],
    range: '500–900 ng/dL (athletic optimal)',
  },
  vitamin_d: {
    what: 'Fat-soluble vitamin / hormone, mostly made from sun exposure.',
    why: 'Low vitamin D blunts strength, immunity, and testosterone.',
    focus: ['Supplement 2000–4000 IU/day with a fat-containing meal', 'Re-test in 8–12 weeks'],
    range: '40–60 ng/mL (athletic optimal)',
  },
  hs_crp: {
    what: 'High-sensitivity C-reactive protein — a systemic inflammation marker.',
    why: 'Chronic elevation slows recovery and raises long-term disease risk.',
    focus: ['Audit sleep, alcohol, and overtraining', 'Add omega-3 and polyphenols (berries, olive oil)', 'Re-test after 8–12 weeks of changes'],
    range: '< 1.0 mg/L (low risk)',
  },
  a1c: {
    what: 'Average blood glucose over the prior ~3 months.',
    why: 'Most stable indicator of glycemic control and metabolic health.',
    focus: ['Strength training improves insulin sensitivity', 'Walk 10–15 min after meals', 'Reduce refined carbs at dinner'],
    range: '< 5.4% (optimal)',
  },
  glucose: {
    what: 'Fasting blood sugar.',
    why: 'A single snapshot — A1c is more reliable, but trending fasting glucose still matters.',
    focus: ['Improve sleep and stress', 'Reduce late-night carbs and alcohol'],
    range: '< 90 mg/dL (optimal)',
  },
  tsh: {
    what: 'Thyroid-stimulating hormone — how hard the pituitary asks the thyroid to work.',
    why: 'Out-of-range TSH affects metabolism, recovery, and mood.',
    focus: ['Discuss with your doctor before any supplementation', 'Adequate iodine, selenium, and calories'],
    range: '0.5–2.5 mIU/L (optimal)',
  },
  ferritin: {
    what: 'Iron stored in the body.',
    why: 'Low ferritin tanks endurance and recovery; very high can signal inflammation.',
    focus: ['If low: red meat, lentils, vitamin-C with iron-rich meals', 'If high: discuss with doctor before supplementing anything'],
    range: '50–150 ng/mL (athletic optimal)',
  },

  adherence: {
    what: 'Percentage of scheduled sessions you completed.',
    why: 'Consistency beats intensity. Adherence above 80% drives long-term progress more than perfect programs.',
    focus: ['Aim for 80%+ over a 4-week window', 'Reschedule rather than skip when life happens'],
  },
  streak: {
    what: 'Consecutive days with a completed session.',
    why: 'Behavior compounds — short streaks make starting tomorrow easier.',
    focus: ['Protect the streak with short "minimum viable" sessions on busy days'],
  },
  markers_optimal: {
    what: 'Blood markers currently inside the optimal reference range.',
    why: 'A higher count means the foundational inputs (sleep, food, training) are working.',
    focus: ['Keep doing what is working', 'Re-test annually or after major changes'],
  },
  markers_out_of_range: {
    what: 'Blood markers currently outside the optimal reference range.',
    why: 'These are the highest-leverage targets for the next training and nutrition block.',
    focus: ['Address one or two markers at a time', 'Re-test 8–12 weeks after changes'],
  },

  region_arms: {
    what: 'Combined fat, lean, and bone mass in both arms (DEXA region).',
    why: 'Arm lean mass is a quick proxy for upper-body training response and protein adequacy.',
    focus: ['Pull and press volume 2–3x/week', 'Hit 0.8–1.0 g protein per lb body weight'],
  },
  region_legs: {
    what: 'Combined fat, lean, and bone mass in both legs (DEXA region).',
    why: 'Lower-body lean mass is the largest contributor to total lean mass and resting metabolic rate.',
    focus: ['Squat / hinge / lunge patterns weekly', 'Walk after meals to support insulin sensitivity'],
  },
  region_trunk: {
    what: 'Torso region — chest, back, and abdomen (DEXA region).',
    why: 'Largest single fat depot and where most fat-mass change shows up first during a cut or surplus.',
    focus: ['Track trunk fat trend across scans, not single readings', 'Combine resistance training with modest deficit'],
  },
  region_android: {
    what: 'Abdominal region around the navel — a subset of trunk (DEXA region).',
    why: 'Higher android fat is the strongest body-comp marker of cardiometabolic risk. Android-to-gynoid ratio matters more than absolute pounds.',
    focus: ['Reduce refined carbs and alcohol', 'Add zone-2 cardio 2–3x/week', 'Sleep 7–9 hours'],
    range: 'Android:Gynoid < 1.0 (men), < 0.8 (women)',
  },
  region_gynoid: {
    what: 'Hip and upper-thigh region (DEXA region).',
    why: 'Gynoid fat is metabolically protective. The android:gynoid ratio is what drives risk, not gynoid alone.',
    focus: ['No need to "spot reduce" — train the legs hard for lean mass'],
  },

  bone_t_score: {
    what: 'Bone density compared to a healthy young adult, in standard deviations.',
    why: 'WHO standard for diagnosing osteopenia and osteoporosis. Drives long-term fracture risk.',
    focus: ['Resistance training 2–4x/week (impact + heavy load)', 'Adequate vitamin D (40–60 ng/mL) and calcium', 'Discuss with your doctor if T-score ≤ −1.0'],
    range: '≥ −1.0 normal · −1.0 to −2.5 osteopenia · ≤ −2.5 osteoporosis',
  },
  bone_z_score: {
    what: 'Bone density compared to peers of the same age and sex.',
    why: 'Useful when T-score is borderline — flags whether bone mass is unusual for your age group.',
    focus: ['Z-score ≤ −2.0 warrants a workup with your doctor'],
    range: '≥ −2.0 expected for age',
  },

  weight_trend: {
    what: 'How to read scale-to-scale weight changes.',
    why: 'Daily weight swings are mostly water, glycogen, and sodium — not fat. A 1–3 lb day-to-day swing is normal noise.',
    focus: ['Compare 7-day averages, not single readings', 'Weigh same time of day, same conditions', 'Expect 0.5–1.0 lb/week of real change in a moderate cut or surplus'],
  },
  health_signals: {
    what: 'How the dashboard chips above are computed.',
    why: 'Chips surface only meaningful shifts so the headline does not get noisy.',
    focus: ['Lean / Fat chips appear when change is ≥ 0.5 lb between scans', 'Marker chip counts blood markers currently outside the optimal range', '"Hold steady" means no signal crossed threshold this period'],
  },
  panel_summary: {
    what: 'How to read the optimal vs out-of-range counts.',
    why: '"Optimal" means inside the athletic-healthy band, not just normal. Out-of-range markers are the highest-leverage targets for the next 8–12 weeks.',
    focus: ['Address one or two markers at a time', 'Re-test 8–12 weeks after changes', 'Discuss persistent flags with your doctor'],
  },
};

/** Resolve a metric key from a free-form marker name (best-effort). */
export function resolveMarkerKey(name: string): MetricKey | null {
  const n = name.toLowerCase();
  if (n.includes('hdl') && n.includes('ratio')) return 'tg_hdl_ratio';
  if (n.includes('hdl')) return 'hdl';
  if (n.includes('ldl')) return 'ldl';
  if (n.includes('triglyceride')) return 'triglycerides';
  if (n.includes('testosterone')) return 'total_testosterone';
  if (n.includes('vitamin d')) return 'vitamin_d';
  if (n.includes('crp')) return 'hs_crp';
  if (n.includes('a1c') || n.includes('hba1c')) return 'a1c';
  if (n.includes('glucose')) return 'glucose';
  if (n.includes('tsh')) return 'tsh';
  if (n.includes('ferritin')) return 'ferritin';
  return null;
}
