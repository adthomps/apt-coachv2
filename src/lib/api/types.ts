/**
 * APT Fitness Coach — Domain Types
 * Body-composition-aware strength coaching system
 * All mass/weight values are in pounds (lbs)
 */

// ============ Base Types ============

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}

export interface ApiError {
  error: { code: string; message: string; details?: Record<string, unknown> };
}

// ============ User ============

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

// ============ Movement Patterns ============

export type MovementPattern =
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'hip_hinge'
  | 'knee_dominant'
  | 'core'
  | 'isolation';

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
  horizontal_push: 'Horizontal Push',
  horizontal_pull: 'Horizontal Pull',
  vertical_push: 'Vertical Push',
  vertical_pull: 'Vertical Pull',
  hip_hinge: 'Hip Hinge',
  knee_dominant: 'Knee Dominant',
  core: 'Core',
  isolation: 'Isolation',
};

// ============ Exercise ============

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  movementPattern: MovementPattern;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  instructions?: string[];
  cues?: string[];
  substitutions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseInput {
  name: string;
  slug?: string;
  movementPattern: MovementPattern;
  muscleGroups: string[];
  equipment: string[];
  difficulty: Exercise['difficulty'];
  description?: string;
  instructions?: string[];
  cues?: string[];
  substitutions?: string[];
}

// ============ Workout Block Types ============

export type BlockType = 'straight_sets' | 'superset' | 'giant_set' | 'six_twelve_twentyfive' | 'drop_set';

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  straight_sets: 'Straight Sets',
  superset: 'Superset',
  giant_set: 'Giant Set',
  six_twelve_twentyfive: '6-12-25',
  drop_set: 'Drop Set',
};

export interface WorkoutBlockItem {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  rpeTarget?: number;
  notes?: string;
  order: number;
}

export interface WorkoutBlock {
  id: string;
  name: string;
  type: BlockType;
  items: WorkoutBlockItem[];
  rounds?: number;
  notes?: string;
  order: number;
}

// ============ Workout ============

export interface Workout {
  id: string;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  blocks: WorkoutBlock[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutInput {
  name: string;
  description?: string;
  difficulty: Workout['difficulty'];
  estimatedDuration: number;
  blocks: Omit<WorkoutBlock, 'id'>[];
  tags?: string[];
}

// ============ Program ============

export interface ProgramDay {
  id: string;
  dayNumber: number;
  workoutId?: string;
  workout?: Workout;
  isRestDay: boolean;
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  durationWeeks: number;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'recomposition' | 'general_fitness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  days: ProgramDay[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramInput {
  name: string;
  description?: string;
  durationWeeks: number;
  goal: Program['goal'];
  difficulty: Program['difficulty'];
  days: Omit<ProgramDay, 'id'>[];
}

// ============ Snapshot (Body Composition) ============
// All mass values in pounds (lbs)

export interface BodyComposition {
  totalMass: number; // lbs
  fatMass: number;   // lbs
  leanMass: number;  // lbs
  boneMass: number;  // lbs
  bodyFatPercentage: number;
  visceralFatArea?: number;
}

export interface RegionalData {
  region: 'arms' | 'legs' | 'trunk' | 'android' | 'gynoid';
  fatMass: number;  // lbs
  leanMass: number; // lbs
  boneMass: number; // lbs
  fatPercentage: number;
}

export interface BoneDensity {
  tScore?: number;
  zScore?: number;
  lumbarSpine?: number;
  femur?: number;
}

export interface Snapshot {
  id: string;
  scanDate: string;
  provider?: string;
  bodyComposition: BodyComposition;
  regionalData: RegionalData[];
  boneDensity?: BoneDensity;
  rawJson: string;
  notes?: string;
  createdAt: string;
}

// ============ Progress Compare ============
// All change values in pounds (lbs)

export interface ProgressCompare {
  currentSnapshot: Snapshot;
  previousSnapshot: Snapshot;
  changes: {
    totalMass: { value: number; percentage: number };
    fatMass: { value: number; percentage: number };
    leanMass: { value: number; percentage: number };
    bodyFatPercentage: { value: number; percentage: number };
    regionalChanges: { region: string; fatChange: number; leanChange: number }[];
  };
  timeSpanDays: number;
}

// ============ Recommendation & Protocol ============

export interface FoodSuggestion {
  title: string;
  description: string;
  category: 'protein' | 'carb' | 'fat' | 'timing';
}

export interface Recommendation {
  action: 'continue' | 'switch' | 'generate';
  programId?: string;
  programName?: string;
  reasoning: string;
  foodSuggestions: FoodSuggestion[];
}

// ============ Import Types ============

export type ImportType = 'exercise_library' | 'workouts' | 'programs' | 'snapshots';

export interface ImportPreviewItem {
  index: number;
  action: 'add' | 'update' | 'skip';
  name: string;
  reason?: string;
  warnings?: string[];
  errors?: string[];
  data: Record<string, unknown>;
}

export interface ImportPreview {
  type: ImportType;
  schemaVersion: string;
  totalItems: number;
  adds: number;
  updates: number;
  skips: number;
  errors: number;
  items: ImportPreviewItem[];
  isValid: boolean;
}

export interface ImportJob {
  id: string;
  type: ImportType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  createdAt: string;
  completedAt?: string;
  errors?: { index: number; message: string }[];
}

// ============ Workout Session ============
// All weight values in pounds (lbs)

export interface SessionSetLog {
  setNumber: number;
  weight: number;    // lbs
  reps: number;
  rpe?: number;
  completed: boolean;
}

export interface SessionExerciseLog {
  exerciseId: string;
  exerciseName: string;
  plannedSets: number;
  plannedRepsMin: number;
  plannedRepsMax: number;
  plannedWeight?: number; // lbs
  actualSets: SessionSetLog[];
  notes?: string;
}

export type SessionKind = 'strength' | 'cardio' | 'mixed';

export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  mixed: 'Mixed',
};

export interface SessionMetrics {
  /** Active calories from a wearable (e.g. Apple Health). */
  activeCalories?: number;
  /** Total calories from a wearable. */
  totalCalories?: number;
  /** Average heart rate (bpm). */
  avgHeartRate?: number;
  /** Peak heart rate (bpm). */
  maxHeartRate?: number;
  /** Subjective Rate of Perceived Exertion 1–10. */
  rpe?: number;
  /** Cardio: distance covered (miles). */
  distanceMiles?: number;
  /** Cardio: average pace (seconds per mile). */
  avgPaceSecPerMile?: number;
  /** Cardio: elevation gain (feet). */
  elevationGainFt?: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  programId?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  /** ISO timestamp the session was started. */
  startedAt: string;
  /** ISO timestamp the session was completed (if completed). */
  completedAt?: string;
  exercises: SessionExerciseLog[];
  /** Wearable / Apple Health style metrics. Optional. */
  metrics?: SessionMetrics;
  notes?: string;
  createdAt: string;
}

// ============ Schedule Entry ============

export interface ScheduleEntry {
  id: string;
  date: string;
  workoutId?: string;
  workoutName?: string;
  programId?: string;
  status: 'scheduled' | 'completed' | 'skipped' | 'rescheduled';
  sessionId?: string;
  notes?: string;
  createdAt: string;
}

// ============ Exercise Performance Profile ============
// All weight values in pounds (lbs)

export type ProgressionState = 'new' | 'progressing' | 'stalled' | 'regressing';
export type FatigueIndicator = 'low' | 'moderate' | 'high';

export interface SessionHistoryEntry {
  sessionId: string;
  date: string;
  weight: number; // lbs
  sets: number;
  avgReps: number;
  topSet: { weight: number; reps: number };
}

export interface ExercisePerformanceProfile {
  exerciseId: string;
  exerciseName: string;
  lastWeight: number;   // lbs
  bestWeight: number;   // lbs
  recentAverageReps: number;
  progressionState: ProgressionState;
  fatigueIndicator: FatigueIndicator;
  sessionHistory: SessionHistoryEntry[];
}

// ============ Adaptive Recommendation ============

export type AdaptiveRecommendationType =
  | 'weight_progression'
  | 'rep_adjustment'
  | 'volume_adjustment'
  | 'exercise_substitution'
  | 'schedule_optimization'
  | 'program_adjustment'
  | 'food_guidance'
  | 'training_insight'
  | 'blood_marker_insight';

export interface AdaptiveRecommendation {
  id: string;
  type: AdaptiveRecommendationType;
  targetExerciseId?: string;
  targetExerciseName?: string;
  suggestedWeight?: number; // lbs
  suggestedReps?: string;
  suggestedSets?: number;
  exerciseSubstitutionId?: string;
  exerciseSubstitutionName?: string;
  scheduleAdjustment?: string;
  foodSuggestion?: string;
  rationale: string;
  confidenceScore: number; // 0-1
  createdAt: string;
}

// ============ Blood Panels (RythmHealth) ============

export type BloodMarkerStatus = 'optimal' | 'average' | 'outOfRange';

export interface BloodMarker {
  marker: string;
  value: number;
  unit: string;
  referenceRange: string;
  referenceMin: number;
  referenceMax: number;
  status: BloodMarkerStatus;
  time: string;
}

export interface BloodPanel {
  id: string;
  source: 'rythmhealth';
  panelDate: string;
  markers: BloodMarker[];
  rawCsv?: string;
  notes?: string;
  createdAt: string;
}

export type BloodMarkerCategory = 'hormones' | 'lipids' | 'metabolic';

export const BLOOD_MARKER_CATEGORIES: Record<BloodMarkerCategory, string[]> = {
  hormones: ['Free T3', 'Thyroid Stimulating Hormone', 'Total Testosterone', 'Free Testosterone', 'Estrogen', 'SHBG'],
  lipids: ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides', 'ApoB', 'Remnant Cholesterol', 'LDL/ApoB Ratio', 'Total Cholesterol/HDL Ratio', 'Triglycerides/HDL Ratio'],
  metabolic: ['Creatinine', 'Albumin', 'Ferritin', 'hs-CRP (High-Sensitivity C-Reactive Protein)', 'Vitamin D'],
};

export const BLOOD_MARKER_CATEGORY_LABELS: Record<BloodMarkerCategory, string> = {
  hormones: 'Hormones',
  lipids: 'Lipids',
  metabolic: 'Metabolic',
};

// ============ Daily Log & Nutrition ============

export interface MealEntry {
  id: string;
  label: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  notes?: string;
  timestamp: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  meals: Record<MealSlot, MealEntry[]>;
  bodyWeight?: number; // lbs
  notes?: string;
}

export type GoalPhase = 'aggressive_cut' | 'cut' | 'maintain' | 'lean_gain';

export const GOAL_PHASE_LABELS: Record<GoalPhase, string> = {
  aggressive_cut: 'Aggressive Cut',
  cut: 'Cut',
  maintain: 'Maintain',
  lean_gain: 'Lean Gain',
};

export const GOAL_PHASE_DELTA: Record<GoalPhase, number> = {
  aggressive_cut: -750,
  cut: -500,
  maintain: 0,
  lean_gain: 200,
};

export interface ActivityLevel {
  value: number;
  label: string;
  description: string;
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { value: 1.2, label: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 1.375, label: 'Light', description: '1–3 sessions/week' },
  { value: 1.55, label: 'Moderate', description: '3–5 sessions/week' },
  { value: 1.725, label: 'Hard', description: '6–7 sessions/week' },
  { value: 1.9, label: 'Athlete', description: '2x/day or physical job' },
];

export interface NutritionGoalOverrides {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface NutritionGoal {
  id: string;
  effectiveFrom: string; // YYYY-MM-DD
  phase: GoalPhase;
  activityMultiplier: number;
  overrides: NutritionGoalOverrides;
  notes?: string;
  createdAt: string;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'auto' | 'phase_adjusted' | 'overridden' | 'custom';
  reasoning: string;
  phase: GoalPhase;
  activityMultiplier: number;
  autoBaseline: { calories: number; protein: number; carbs: number; fat: number };
  overridden: { calories: boolean; protein: boolean; carbs: boolean; fat: boolean };
}