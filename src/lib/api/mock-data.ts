/**
 * APT Fitness Coach — Mock Data
 * All mass values in pounds (lbs)
 */

import type {
  Exercise, Workout, Program, Snapshot, ImportJob,
  WorkoutSession, ScheduleEntry, ExercisePerformanceProfile, AdaptiveRecommendation,
  BloodPanel,
} from './types';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const mockExercises: Exercise[] = [
  {
    id: 'ex_1', slug: 'barbell-bench-press', name: 'Barbell Bench Press',
    movementPattern: 'horizontal_push', muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['barbell', 'bench'], difficulty: 'intermediate',
    description: 'Classic chest builder targeting the pectorals, front delts, and triceps.',
    instructions: ['Lie flat on the bench with feet firmly on the ground', 'Grip the bar slightly wider than shoulder width', 'Lower the bar to mid-chest with control', 'Press back up to full lockout'],
    cues: ['Retract shoulder blades', 'Drive through the floor with feet', 'Bar path: slight diagonal from chest to over shoulders'],
    substitutions: ['dumbbell-bench-press', 'machine-chest-press'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_2', slug: 'barbell-back-squat', name: 'Barbell Back Squat',
    movementPattern: 'knee_dominant', muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    equipment: ['barbell', 'squat rack'], difficulty: 'intermediate',
    description: 'The king of lower body exercises. Builds overall leg mass and strength.',
    instructions: ['Position bar on upper traps', 'Unrack and step back', 'Sit back and down, breaking at hips and knees', 'Descend to parallel or below', 'Drive up through heels'],
    cues: ['Chest up, elbows under bar', 'Knees track over toes', 'Brace your core before descending'],
    substitutions: ['leg-press', 'goblet-squat'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_3', slug: 'conventional-deadlift', name: 'Conventional Deadlift',
    movementPattern: 'hip_hinge', muscleGroups: ['back', 'glutes', 'hamstrings', 'core'],
    equipment: ['barbell'], difficulty: 'advanced',
    description: 'Full body posterior chain exercise. The ultimate strength builder.',
    instructions: ['Stand with feet hip-width, bar over mid-foot', 'Hinge at hips, grip bar outside knees', 'Flatten back, brace core', 'Drive through floor, extending hips and knees', 'Lock out at top'],
    cues: ['Push the floor away', 'Keep lats engaged — protect your armpits', 'Bar stays close to body'],
    substitutions: ['romanian-deadlift', 'trap-bar-deadlift'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_4', slug: 'pull-ups', name: 'Pull-ups',
    movementPattern: 'vertical_pull', muscleGroups: ['lats', 'biceps', 'rear delts'],
    equipment: ['pull-up bar'], difficulty: 'intermediate',
    description: 'Bodyweight vertical pulling movement for lat width and back development.',
    instructions: ['Hang from bar with overhand grip, slightly wider than shoulders', 'Pull chest toward bar', 'Lower under control'],
    cues: ['Initiate by depressing shoulder blades', 'Drive elbows to hips', 'Full dead hang at bottom'],
    substitutions: ['lat-pulldown', 'band-assisted-pull-ups'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_5', slug: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise',
    movementPattern: 'isolation', muscleGroups: ['shoulders'],
    equipment: ['dumbbells'], difficulty: 'beginner',
    description: 'Isolation movement for the lateral (medial) deltoid head.',
    instructions: ['Stand holding dumbbells at sides', 'Raise arms to sides until parallel to floor', 'Lower under control'],
    cues: ['Slight bend in elbows', 'Lead with elbows, not hands', 'Pinky finger slightly higher than thumb'],
    substitutions: ['cable-lateral-raise', 'machine-lateral-raise'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_6', slug: 'leg-press', name: 'Leg Press',
    movementPattern: 'knee_dominant', muscleGroups: ['quadriceps', 'glutes'],
    equipment: ['leg press machine'], difficulty: 'beginner',
    description: 'Machine-based quad-dominant movement. Great for adding volume safely.',
    cues: ['Keep lower back flat against pad', 'Don\'t lock out knees at top'],
    substitutions: ['barbell-back-squat', 'hack-squat'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_7', slug: 'barbell-row', name: 'Barbell Row',
    movementPattern: 'horizontal_pull', muscleGroups: ['back', 'biceps', 'rear delts'],
    equipment: ['barbell'], difficulty: 'intermediate',
    description: 'Compound horizontal pull for upper back thickness.',
    instructions: ['Hinge forward ~45 degrees', 'Pull bar to lower chest/upper abdomen', 'Squeeze shoulder blades at top', 'Lower under control'],
    cues: ['Keep torso angle consistent', 'Pull elbows past torso', 'Avoid using momentum'],
    substitutions: ['dumbbell-row', 'cable-row'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_8', slug: 'overhead-press', name: 'Overhead Press',
    movementPattern: 'vertical_push', muscleGroups: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'], difficulty: 'intermediate',
    description: 'Standing barbell press for overhead strength and shoulder mass.',
    instructions: ['Unrack bar at collarbone height', 'Brace core, squeeze glutes', 'Press bar overhead in a slight arc', 'Lock out overhead, head through'],
    cues: ['Move head back then forward as bar passes', 'Vertical forearms at start', 'Full lockout at top'],
    substitutions: ['dumbbell-shoulder-press', 'seated-overhead-press'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_9', slug: 'romanian-deadlift', name: 'Romanian Deadlift',
    movementPattern: 'hip_hinge', muscleGroups: ['hamstrings', 'glutes', 'lower back'],
    equipment: ['barbell'], difficulty: 'intermediate',
    description: 'Hip hinge focusing on hamstring and glute eccentrics.',
    instructions: ['Start standing with bar at hip height', 'Push hips back, lowering bar along thighs', 'Slight knee bend, feel hamstring stretch', 'Reverse by driving hips forward'],
    cues: ['Bar stays close to legs', 'Stop when you feel hamstring tension, not at the floor', 'Hinge, don\'t squat'],
    substitutions: ['conventional-deadlift', 'dumbbell-rdl'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_10', slug: 'dumbbell-bench-press', name: 'Dumbbell Bench Press',
    movementPattern: 'horizontal_push', muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['dumbbells', 'bench'], difficulty: 'beginner',
    description: 'Dumbbell variant of the bench press allowing a greater range of motion.',
    cues: ['Bring dumbbells deep at bottom for full stretch', 'Press and slightly converge at top'],
    substitutions: ['barbell-bench-press', 'machine-chest-press'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_11', slug: 'lat-pulldown', name: 'Lat Pulldown',
    movementPattern: 'vertical_pull', muscleGroups: ['lats', 'biceps'],
    equipment: ['cable machine'], difficulty: 'beginner',
    description: 'Machine-based vertical pull. Build up to pull-ups or add volume.',
    cues: ['Lean back slightly', 'Pull bar to upper chest', 'Full stretch at top'],
    substitutions: ['pull-ups', 'band-assisted-pull-ups'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_12', slug: 'cable-row', name: 'Seated Cable Row',
    movementPattern: 'horizontal_pull', muscleGroups: ['back', 'biceps', 'rear delts'],
    equipment: ['cable machine'], difficulty: 'beginner',
    description: 'Seated horizontal pulling for back thickness with controlled ROM.',
    cues: ['Sit tall, chest proud', 'Pull handle to lower sternum', 'Squeeze shoulder blades'],
    substitutions: ['barbell-row', 'dumbbell-row'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_13', slug: 'plank', name: 'Plank',
    movementPattern: 'core', muscleGroups: ['core', 'shoulders'],
    equipment: ['bodyweight'], difficulty: 'beginner',
    description: 'Isometric core stability exercise.',
    cues: ['Straight line from head to heels', 'Squeeze glutes', 'Don\'t let hips sag or pike'],
    substitutions: ['dead-bug', 'pallof-press'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_14', slug: 'bicep-curl', name: 'Bicep Curl',
    movementPattern: 'isolation', muscleGroups: ['biceps'],
    equipment: ['dumbbells'], difficulty: 'beginner',
    description: 'Classic isolation movement for bicep development.',
    cues: ['Keep elbows pinned to sides', 'Full extension at bottom', 'Squeeze at peak contraction'],
    substitutions: ['hammer-curl', 'cable-curl'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_15', slug: 'tricep-pushdown', name: 'Tricep Pushdown',
    movementPattern: 'isolation', muscleGroups: ['triceps'],
    equipment: ['cable machine'], difficulty: 'beginner',
    description: 'Cable isolation for triceps. Great finisher for push days.',
    cues: ['Elbows stay tight to body', 'Full lockout at bottom', 'Control the eccentric'],
    substitutions: ['overhead-tricep-extension', 'dips'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex_16', slug: 'goblet-squat', name: 'Goblet Squat',
    movementPattern: 'knee_dominant', muscleGroups: ['quadriceps', 'glutes', 'core'],
    equipment: ['dumbbell', 'kettlebell'], difficulty: 'beginner',
    description: 'Front-loaded squat variation. Great for learning squat mechanics.',
    cues: ['Hold weight at chest', 'Elbows between knees at bottom', 'Stay upright'],
    substitutions: ['barbell-back-squat', 'leg-press'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockWorkouts: Workout[] = [
  {
    id: 'wk_1', name: 'Upper Body Push', description: 'Chest, shoulders, triceps — horizontal and vertical push focus',
    difficulty: 'intermediate', estimatedDuration: 60,
    blocks: [
      {
        id: 'blk_1', name: 'Main Strength', type: 'straight_sets', order: 0,
        items: [
          { id: 'bi_1', exerciseId: 'ex_1', sets: 4, repsMin: 5, repsMax: 7, restSeconds: 180, rpeTarget: 8, order: 0 },
          { id: 'bi_2', exerciseId: 'ex_8', sets: 4, repsMin: 5, repsMax: 7, restSeconds: 180, rpeTarget: 8, order: 1 },
        ],
      },
      {
        id: 'blk_2', name: 'Accessory Superset', type: 'superset', rounds: 3, order: 1,
        items: [
          { id: 'bi_3', exerciseId: 'ex_10', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, order: 0 },
          { id: 'bi_4', exerciseId: 'ex_5', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, order: 1 },
        ],
      },
      {
        id: 'blk_3', name: 'Tricep Finisher', type: 'drop_set', order: 2,
        items: [
          { id: 'bi_5', exerciseId: 'ex_15', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 30, order: 0 },
        ],
      },
    ],
    tags: ['push', 'upper', 'strength'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wk_2', name: 'Upper Body Pull', description: 'Back and biceps — horizontal and vertical pull focus',
    difficulty: 'intermediate', estimatedDuration: 55,
    blocks: [
      {
        id: 'blk_4', name: 'Main Strength', type: 'straight_sets', order: 0,
        items: [
          { id: 'bi_6', exerciseId: 'ex_3', sets: 4, repsMin: 3, repsMax: 5, restSeconds: 240, rpeTarget: 8, order: 0 },
          { id: 'bi_7', exerciseId: 'ex_4', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120, order: 1 },
        ],
      },
      {
        id: 'blk_5', name: 'Volume Work', type: 'superset', rounds: 3, order: 1,
        items: [
          { id: 'bi_8', exerciseId: 'ex_7', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60, order: 0 },
          { id: 'bi_9', exerciseId: 'ex_12', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, order: 1 },
        ],
      },
      {
        id: 'blk_6', name: 'Bicep Finisher', type: 'straight_sets', order: 2,
        items: [
          { id: 'bi_10', exerciseId: 'ex_14', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, order: 0 },
        ],
      },
    ],
    tags: ['pull', 'upper', 'strength'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wk_3', name: 'Lower Body', description: 'Quads, glutes, hamstrings — squat and hinge focus',
    difficulty: 'intermediate', estimatedDuration: 65,
    blocks: [
      {
        id: 'blk_7', name: 'Main Strength', type: 'straight_sets', order: 0,
        items: [
          { id: 'bi_11', exerciseId: 'ex_2', sets: 4, repsMin: 5, repsMax: 7, restSeconds: 180, rpeTarget: 8, order: 0 },
          { id: 'bi_12', exerciseId: 'ex_9', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120, order: 1 },
        ],
      },
      {
        id: 'blk_8', name: 'Volume', type: 'giant_set', rounds: 3, order: 1,
        items: [
          { id: 'bi_13', exerciseId: 'ex_6', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45, order: 0 },
          { id: 'bi_14', exerciseId: 'ex_16', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 45, order: 1 },
          { id: 'bi_15', exerciseId: 'ex_13', sets: 3, repsMin: 30, repsMax: 45, restSeconds: 60, notes: 'seconds hold', order: 2 },
        ],
      },
    ],
    tags: ['legs', 'lower', 'strength'],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockPrograms: Program[] = [
  {
    id: 'prog_1', name: 'Upper/Lower Recomp', description: 'A 4-day upper/lower split optimized for body recomposition. Focus on strength in main lifts with hypertrophy accessory work.',
    durationWeeks: 8, goal: 'recomposition', difficulty: 'intermediate',
    days: [
      { id: 'pd_1', dayNumber: 1, workoutId: 'wk_1', isRestDay: false },
      { id: 'pd_2', dayNumber: 2, workoutId: 'wk_3', isRestDay: false },
      { id: 'pd_3', dayNumber: 3, isRestDay: true, notes: 'Active recovery' },
      { id: 'pd_4', dayNumber: 4, workoutId: 'wk_2', isRestDay: false },
      { id: 'pd_5', dayNumber: 5, workoutId: 'wk_3', isRestDay: false },
      { id: 'pd_6', dayNumber: 6, isRestDay: true },
      { id: 'pd_7', dayNumber: 7, isRestDay: true },
    ],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
];

// All mass values in lbs
export const mockSnapshots: Snapshot[] = [
  {
    id: 'snap_1', scanDate: '2024-01-15', provider: 'BodySpec',
    bodyComposition: { totalMass: 181.9, fatMass: 30.9, leanMass: 143.9, boneMass: 7.1, bodyFatPercentage: 17.0, visceralFatArea: 85 },
    regionalData: [
      { region: 'arms', fatMass: 2.6, leanMass: 18.7, boneMass: 1.3, fatPercentage: 12.0 },
      { region: 'legs', fatMass: 9.3, leanMass: 48.5, boneMass: 2.6, fatPercentage: 15.0 },
      { region: 'trunk', fatMass: 16.5, leanMass: 66.1, boneMass: 2.2, fatPercentage: 19.5 },
      { region: 'android', fatMass: 4.0, leanMass: 17.6, boneMass: 0.4, fatPercentage: 18.0 },
      { region: 'gynoid', fatMass: 5.5, leanMass: 26.5, boneMass: 0.9, fatPercentage: 16.5 },
    ],
    boneDensity: { tScore: 0.8, zScore: 1.2, lumbarSpine: 1.15, femur: 1.08 },
    rawJson: JSON.stringify({ source: 'bodyspec', scan_date: '2024-01-15', total_mass_lbs: 181.9, fat_mass_lbs: 30.9, lean_mass_lbs: 143.9, bone_mass_lbs: 7.1, body_fat_pct: 17.0 }),
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'snap_2', scanDate: '2024-04-15', provider: 'BodySpec',
    bodyComposition: { totalMass: 183.4, fatMass: 27.6, leanMass: 148.8, boneMass: 7.1, bodyFatPercentage: 15.0, visceralFatArea: 78 },
    regionalData: [
      { region: 'arms', fatMass: 2.2, leanMass: 20.3, boneMass: 1.3, fatPercentage: 9.5 },
      { region: 'legs', fatMass: 8.4, leanMass: 51.8, boneMass: 2.6, fatPercentage: 13.5 },
      { region: 'trunk', fatMass: 14.3, leanMass: 68.3, boneMass: 2.2, fatPercentage: 16.8 },
      { region: 'android', fatMass: 3.1, leanMass: 18.7, boneMass: 0.4, fatPercentage: 14.0 },
      { region: 'gynoid', fatMass: 4.9, leanMass: 28.2, boneMass: 0.9, fatPercentage: 14.3 },
    ],
    boneDensity: { tScore: 0.9, zScore: 1.3, lumbarSpine: 1.17, femur: 1.10 },
    rawJson: JSON.stringify({ source: 'bodyspec', scan_date: '2024-04-15', total_mass_lbs: 183.4, fat_mass_lbs: 27.6, lean_mass_lbs: 148.8, bone_mass_lbs: 7.1, body_fat_pct: 15.0 }),
    createdAt: '2024-04-15T10:00:00Z',
  },
  {
    id: 'snap_3', scanDate: '2024-07-15', provider: 'BodySpec',
    bodyComposition: { totalMass: 185.2, fatMass: 26.0, leanMass: 152.1, boneMass: 7.1, bodyFatPercentage: 14.0, visceralFatArea: 72 },
    regionalData: [
      { region: 'arms', fatMass: 2.0, leanMass: 21.6, boneMass: 1.3, fatPercentage: 8.0 },
      { region: 'legs', fatMass: 7.7, leanMass: 54.0, boneMass: 2.6, fatPercentage: 12.0 },
      { region: 'trunk', fatMass: 13.2, leanMass: 70.1, boneMass: 2.2, fatPercentage: 15.5 },
      { region: 'android', fatMass: 2.6, leanMass: 19.4, boneMass: 0.4, fatPercentage: 12.0 },
      { region: 'gynoid', fatMass: 4.4, leanMass: 29.1, boneMass: 0.9, fatPercentage: 13.0 },
    ],
    boneDensity: { tScore: 1.0, zScore: 1.4, lumbarSpine: 1.19, femur: 1.12 },
    rawJson: JSON.stringify({ source: 'bodyspec', scan_date: '2024-07-15', total_mass_lbs: 185.2, fat_mass_lbs: 26.0, lean_mass_lbs: 152.1, bone_mass_lbs: 7.1, body_fat_pct: 14.0 }),
    createdAt: '2024-07-15T10:00:00Z',
  },
  // Withings smart-scale weekly readings — interleaved with DEXA scans for trend visibility.
  {
    id: 'snap_w1', scanDate: '2024-07-22', provider: 'Withings',
    bodyComposition: { totalMass: 184.6, fatMass: 25.4, leanMass: 152.1, boneMass: 7.1, bodyFatPercentage: 13.8 },
    regionalData: [],
    rawJson: JSON.stringify({ source: 'withings', weight: 184.6, bodyFatPct: 13.8 }),
    notes: 'Morning, fasted.',
    createdAt: '2024-07-22T07:15:00Z',
  },
  {
    id: 'snap_w2', scanDate: '2024-07-29', provider: 'Withings',
    bodyComposition: { totalMass: 184.0, fatMass: 24.7, leanMass: 152.2, boneMass: 7.1, bodyFatPercentage: 13.4 },
    regionalData: [],
    rawJson: JSON.stringify({ source: 'withings', weight: 184.0, bodyFatPct: 13.4 }),
    createdAt: '2024-07-29T07:10:00Z',
  },
  {
    id: 'snap_w3', scanDate: '2024-08-05', provider: 'Withings',
    bodyComposition: { totalMass: 183.6, fatMass: 24.2, leanMass: 152.3, boneMass: 7.1, bodyFatPercentage: 13.2 },
    regionalData: [],
    rawJson: JSON.stringify({ source: 'withings', weight: 183.6, bodyFatPct: 13.2 }),
    notes: 'Post-deload week.',
    createdAt: '2024-08-05T07:05:00Z',
  },
];
  {
    id: 'import_1', type: 'exercise_library', status: 'completed',
    totalItems: 16, processedItems: 16, successItems: 16, failedItems: 0,
    createdAt: '2024-06-01T10:00:00Z', completedAt: '2024-06-01T10:00:05Z',
  },
  {
    id: 'import_2', type: 'snapshots', status: 'completed',
    totalItems: 3, processedItems: 3, successItems: 3, failedItems: 0,
    createdAt: '2024-07-15T10:30:00Z', completedAt: '2024-07-15T10:30:02Z',
  },
];

// ============ Workout Sessions (mock 6 weeks of training) ============

export const mockSessions: WorkoutSession[] = [
  {
    id: 'sess_1', workoutId: 'wk_1', workoutName: 'Upper Body Push', programId: 'prog_1',
    status: 'completed', startedAt: '2024-06-03T07:00:00Z', completedAt: '2024-06-03T08:05:00Z',
    exercises: [
      { exerciseId: 'ex_1', exerciseName: 'Barbell Bench Press', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 175,
        actualSets: [
          { setNumber: 1, weight: 175, reps: 7, rpe: 7, completed: true },
          { setNumber: 2, weight: 175, reps: 7, rpe: 7.5, completed: true },
          { setNumber: 3, weight: 175, reps: 6, rpe: 8, completed: true },
          { setNumber: 4, weight: 175, reps: 5, rpe: 8.5, completed: true },
        ] },
      { exerciseId: 'ex_8', exerciseName: 'Overhead Press', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 115,
        actualSets: [
          { setNumber: 1, weight: 115, reps: 6, rpe: 7.5, completed: true },
          { setNumber: 2, weight: 115, reps: 6, rpe: 8, completed: true },
          { setNumber: 3, weight: 115, reps: 5, rpe: 8.5, completed: true },
          { setNumber: 4, weight: 115, reps: 5, rpe: 9, completed: true },
        ] },
    ],
    createdAt: '2024-06-03T07:00:00Z',
  },
  {
    id: 'sess_2', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1',
    status: 'completed', startedAt: '2024-06-04T07:00:00Z', completedAt: '2024-06-04T08:10:00Z',
    exercises: [
      { exerciseId: 'ex_2', exerciseName: 'Barbell Back Squat', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 225,
        actualSets: [
          { setNumber: 1, weight: 225, reps: 7, rpe: 7, completed: true },
          { setNumber: 2, weight: 225, reps: 6, rpe: 7.5, completed: true },
          { setNumber: 3, weight: 225, reps: 6, rpe: 8, completed: true },
          { setNumber: 4, weight: 225, reps: 5, rpe: 8.5, completed: true },
        ] },
      { exerciseId: 'ex_9', exerciseName: 'Romanian Deadlift', plannedSets: 4, plannedRepsMin: 8, plannedRepsMax: 10, plannedWeight: 185,
        actualSets: [
          { setNumber: 1, weight: 185, reps: 10, rpe: 7, completed: true },
          { setNumber: 2, weight: 185, reps: 9, rpe: 7.5, completed: true },
          { setNumber: 3, weight: 185, reps: 8, rpe: 8, completed: true },
          { setNumber: 4, weight: 185, reps: 8, rpe: 8.5, completed: true },
        ] },
    ],
    createdAt: '2024-06-04T07:00:00Z',
  },
  {
    id: 'sess_3', workoutId: 'wk_1', workoutName: 'Upper Body Push', programId: 'prog_1',
    status: 'completed', startedAt: '2024-06-10T07:00:00Z', completedAt: '2024-06-10T08:00:00Z',
    exercises: [
      { exerciseId: 'ex_1', exerciseName: 'Barbell Bench Press', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 180,
        actualSets: [
          { setNumber: 1, weight: 180, reps: 7, rpe: 7.5, completed: true },
          { setNumber: 2, weight: 180, reps: 6, rpe: 8, completed: true },
          { setNumber: 3, weight: 180, reps: 6, rpe: 8, completed: true },
          { setNumber: 4, weight: 180, reps: 5, rpe: 8.5, completed: true },
        ] },
      { exerciseId: 'ex_8', exerciseName: 'Overhead Press', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 115,
        actualSets: [
          { setNumber: 1, weight: 115, reps: 7, rpe: 7, completed: true },
          { setNumber: 2, weight: 115, reps: 6, rpe: 7.5, completed: true },
          { setNumber: 3, weight: 115, reps: 6, rpe: 8, completed: true },
          { setNumber: 4, weight: 115, reps: 5, rpe: 8.5, completed: true },
        ] },
    ],
    createdAt: '2024-06-10T07:00:00Z',
  },
  {
    id: 'sess_4', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1',
    status: 'completed', startedAt: '2024-06-11T07:00:00Z', completedAt: '2024-06-11T08:05:00Z',
    exercises: [
      { exerciseId: 'ex_2', exerciseName: 'Barbell Back Squat', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 230,
        actualSets: [
          { setNumber: 1, weight: 230, reps: 6, rpe: 7.5, completed: true },
          { setNumber: 2, weight: 230, reps: 6, rpe: 8, completed: true },
          { setNumber: 3, weight: 230, reps: 5, rpe: 8.5, completed: true },
          { setNumber: 4, weight: 230, reps: 5, rpe: 9, completed: true },
        ] },
    ],
    createdAt: '2024-06-11T07:00:00Z',
  },
  {
    id: 'sess_5', workoutId: 'wk_1', workoutName: 'Upper Body Push', programId: 'prog_1',
    status: 'completed', startedAt: '2024-06-17T07:00:00Z', completedAt: '2024-06-17T08:00:00Z',
    exercises: [
      { exerciseId: 'ex_1', exerciseName: 'Barbell Bench Press', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 185,
        actualSets: [
          { setNumber: 1, weight: 185, reps: 6, rpe: 7.5, completed: true },
          { setNumber: 2, weight: 185, reps: 6, rpe: 8, completed: true },
          { setNumber: 3, weight: 185, reps: 5, rpe: 8.5, completed: true },
          { setNumber: 4, weight: 185, reps: 5, rpe: 9, completed: true },
        ] },
      { exerciseId: 'ex_8', exerciseName: 'Overhead Press', plannedSets: 4, plannedRepsMin: 5, plannedRepsMax: 7, plannedWeight: 120,
        actualSets: [
          { setNumber: 1, weight: 120, reps: 6, rpe: 8, completed: true },
          { setNumber: 2, weight: 120, reps: 5, rpe: 8.5, completed: true },
          { setNumber: 3, weight: 120, reps: 5, rpe: 9, completed: true },
          { setNumber: 4, weight: 120, reps: 4, rpe: 9.5, completed: true },
        ] },
    ],
    createdAt: '2024-06-17T07:00:00Z',
  },
  {
    id: 'sess_6', workoutId: 'wk_2', workoutName: 'Upper Body Pull', programId: 'prog_1',
    status: 'completed', startedAt: '2024-06-19T07:00:00Z', completedAt: '2024-06-19T07:55:00Z',
    metrics: { activeCalories: 345, totalCalories: 448, avgHeartRate: 124, rpe: 6 },
    notes: 'Felt strong on deadlifts. Bar speed crisp.',
    exercises: [
      { exerciseId: 'ex_3', exerciseName: 'Conventional Deadlift', plannedSets: 4, plannedRepsMin: 3, plannedRepsMax: 5, plannedWeight: 315,
        actualSets: [
          { setNumber: 1, weight: 315, reps: 5, rpe: 7.5, completed: true },
          { setNumber: 2, weight: 315, reps: 4, rpe: 8, completed: true },
          { setNumber: 3, weight: 315, reps: 4, rpe: 8.5, completed: true },
          { setNumber: 4, weight: 315, reps: 3, rpe: 9, completed: true },
        ] },
      { exerciseId: 'ex_7', exerciseName: 'Barbell Row', plannedSets: 3, plannedRepsMin: 8, plannedRepsMax: 10, plannedWeight: 155,
        actualSets: [
          { setNumber: 1, weight: 155, reps: 10, rpe: 7, completed: true },
          { setNumber: 2, weight: 155, reps: 9, rpe: 7.5, completed: true },
          { setNumber: 3, weight: 155, reps: 8, rpe: 8, completed: true },
        ] },
    ],
    createdAt: '2024-06-19T07:00:00Z',
  },
];

// ============ Schedule Entries ============

export const mockScheduleEntries: ScheduleEntry[] = [
  { id: 'sched_1', date: '2024-06-03', workoutId: 'wk_1', workoutName: 'Upper Body Push', programId: 'prog_1', status: 'completed', sessionId: 'sess_1', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'sched_2', date: '2024-06-04', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1', status: 'completed', sessionId: 'sess_2', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'sched_3', date: '2024-06-06', workoutId: 'wk_2', workoutName: 'Upper Body Pull', programId: 'prog_1', status: 'skipped', notes: 'Feeling under the weather', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'sched_4', date: '2024-06-07', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1', status: 'skipped', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'sched_5', date: '2024-06-10', workoutId: 'wk_1', workoutName: 'Upper Body Push', programId: 'prog_1', status: 'completed', sessionId: 'sess_3', createdAt: '2024-06-08T00:00:00Z' },
  { id: 'sched_6', date: '2024-06-11', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1', status: 'completed', sessionId: 'sess_4', createdAt: '2024-06-08T00:00:00Z' },
  { id: 'sched_7', date: '2024-06-13', workoutId: 'wk_2', workoutName: 'Upper Body Pull', programId: 'prog_1', status: 'skipped', createdAt: '2024-06-08T00:00:00Z' },
  { id: 'sched_8', date: '2024-06-14', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1', status: 'completed', createdAt: '2024-06-08T00:00:00Z' },
  { id: 'sched_9', date: '2024-06-17', workoutId: 'wk_1', workoutName: 'Upper Body Push', programId: 'prog_1', status: 'completed', sessionId: 'sess_5', createdAt: '2024-06-15T00:00:00Z' },
  { id: 'sched_10', date: '2024-06-19', workoutId: 'wk_2', workoutName: 'Upper Body Pull', programId: 'prog_1', status: 'completed', sessionId: 'sess_6', createdAt: '2024-06-15T00:00:00Z' },
  { id: 'sched_11', date: '2024-06-24', workoutId: 'wk_1', workoutName: 'Upper Body Push', programId: 'prog_1', status: 'scheduled', createdAt: '2024-06-20T00:00:00Z' },
  { id: 'sched_12', date: '2024-06-25', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1', status: 'scheduled', createdAt: '2024-06-20T00:00:00Z' },
  { id: 'sched_13', date: '2024-06-27', workoutId: 'wk_2', workoutName: 'Upper Body Pull', programId: 'prog_1', status: 'scheduled', createdAt: '2024-06-20T00:00:00Z' },
  { id: 'sched_14', date: '2024-06-28', workoutId: 'wk_3', workoutName: 'Lower Body', programId: 'prog_1', status: 'scheduled', createdAt: '2024-06-20T00:00:00Z' },
];

// ============ Exercise Performance Profiles ============

export const mockPerformanceProfiles: ExercisePerformanceProfile[] = [
  {
    exerciseId: 'ex_1', exerciseName: 'Barbell Bench Press',
    lastWeight: 185, bestWeight: 185, recentAverageReps: 6,
    progressionState: 'progressing', fatigueIndicator: 'low',
    sessionHistory: [
      { sessionId: 'sess_5', date: '2024-06-17', weight: 185, sets: 4, avgReps: 5.5, topSet: { weight: 185, reps: 6 } },
      { sessionId: 'sess_3', date: '2024-06-10', weight: 180, sets: 4, avgReps: 6, topSet: { weight: 180, reps: 7 } },
      { sessionId: 'sess_1', date: '2024-06-03', weight: 175, sets: 4, avgReps: 6.25, topSet: { weight: 175, reps: 7 } },
    ],
  },
  {
    exerciseId: 'ex_8', exerciseName: 'Overhead Press',
    lastWeight: 120, bestWeight: 120, recentAverageReps: 5.5,
    progressionState: 'progressing', fatigueIndicator: 'moderate',
    sessionHistory: [
      { sessionId: 'sess_5', date: '2024-06-17', weight: 120, sets: 4, avgReps: 5, topSet: { weight: 120, reps: 6 } },
      { sessionId: 'sess_3', date: '2024-06-10', weight: 115, sets: 4, avgReps: 6, topSet: { weight: 115, reps: 7 } },
      { sessionId: 'sess_1', date: '2024-06-03', weight: 115, sets: 4, avgReps: 5.5, topSet: { weight: 115, reps: 6 } },
    ],
  },
  {
    exerciseId: 'ex_2', exerciseName: 'Barbell Back Squat',
    lastWeight: 230, bestWeight: 230, recentAverageReps: 5.5,
    progressionState: 'progressing', fatigueIndicator: 'low',
    sessionHistory: [
      { sessionId: 'sess_4', date: '2024-06-11', weight: 230, sets: 4, avgReps: 5.5, topSet: { weight: 230, reps: 6 } },
      { sessionId: 'sess_2', date: '2024-06-04', weight: 225, sets: 4, avgReps: 6, topSet: { weight: 225, reps: 7 } },
    ],
  },
  {
    exerciseId: 'ex_3', exerciseName: 'Conventional Deadlift',
    lastWeight: 315, bestWeight: 315, recentAverageReps: 4,
    progressionState: 'progressing', fatigueIndicator: 'low',
    sessionHistory: [
      { sessionId: 'sess_6', date: '2024-06-19', weight: 315, sets: 4, avgReps: 4, topSet: { weight: 315, reps: 5 } },
    ],
  },
  {
    exerciseId: 'ex_9', exerciseName: 'Romanian Deadlift',
    lastWeight: 185, bestWeight: 185, recentAverageReps: 8.75,
    progressionState: 'progressing', fatigueIndicator: 'low',
    sessionHistory: [
      { sessionId: 'sess_2', date: '2024-06-04', weight: 185, sets: 4, avgReps: 8.75, topSet: { weight: 185, reps: 10 } },
    ],
  },
  {
    exerciseId: 'ex_7', exerciseName: 'Barbell Row',
    lastWeight: 155, bestWeight: 155, recentAverageReps: 9,
    progressionState: 'progressing', fatigueIndicator: 'low',
    sessionHistory: [
      { sessionId: 'sess_6', date: '2024-06-19', weight: 155, sets: 3, avgReps: 9, topSet: { weight: 155, reps: 10 } },
    ],
  },
];

// ============ Adaptive Recommendations (pre-computed mock) ============

export const mockAdaptiveRecommendations: AdaptiveRecommendation[] = [
  {
    id: 'arec_1', type: 'weight_progression',
    targetExerciseId: 'ex_1', targetExerciseName: 'Barbell Bench Press',
    suggestedWeight: 190,
    rationale: 'Bench Press has progressed from 175 to 185 lbs over 3 sessions with consistent rep targets. Time to move to 190 lbs.',
    confidenceScore: 0.85, createdAt: '2024-06-18T00:00:00Z',
  },
  {
    id: 'arec_2', type: 'weight_progression',
    targetExerciseId: 'ex_2', targetExerciseName: 'Barbell Back Squat',
    suggestedWeight: 235,
    rationale: 'Squat moved from 225 to 230 lbs with good rep completion. Push to 235 lbs next session.',
    confidenceScore: 0.8, createdAt: '2024-06-18T00:00:00Z',
  },
  {
    id: 'arec_3', type: 'training_insight',
    rationale: 'Great recomposition: you\'ve lost 4.9 lbs of fat while gaining 8.2 lbs of lean mass over 6 months. Keep your current program structure.',
    confidenceScore: 0.9, createdAt: '2024-06-18T00:00:00Z',
  },
  {
    id: 'arec_4', type: 'schedule_optimization',
    scheduleAdjustment: 'adjust_days',
    rationale: 'You\'ve skipped 3 out of 10 scheduled workouts (30%), mostly on Thursdays and Fridays. Consider shifting pull day earlier in the week.',
    confidenceScore: 0.7, createdAt: '2024-06-18T00:00:00Z',
  },
  {
    id: 'arec_5', type: 'food_guidance',
    foodSuggestion: 'Strength is improving and body fat is decreasing. Maintain current intake and ensure 152g protein/day (1g per lb lean mass).',
    rationale: 'Body composition trending positively with consistent strength gains. Nutrition appears well-dialed.',
    confidenceScore: 0.85, createdAt: '2024-06-18T00:00:00Z',
  },
];

// ============ Blood Panels (RythmHealth) ============

export const mockBloodPanels: BloodPanel[] = [
  {
    id: 'bp_1',
    source: 'rythmhealth',
    panelDate: '2026-03-09',
    markers: [
      { marker: 'Free T3', value: 4.25, unit: 'pg/mL', referenceRange: '2 - 4.4', referenceMin: 2, referenceMax: 4.4, status: 'optimal', time: '2026-03-09' },
      { marker: 'Thyroid Stimulating Hormone', value: 2.22, unit: 'uIU/mL', referenceRange: '0.45 - 4.5', referenceMin: 0.45, referenceMax: 4.5, status: 'optimal', time: '2026-03-09' },
      { marker: 'Creatinine', value: 1.10, unit: 'mg/dL', referenceRange: '0.6 - 1.2', referenceMin: 0.6, referenceMax: 1.2, status: 'optimal', time: '2026-03-09' },
      { marker: 'ApoB', value: 131, unit: 'mg/dL', referenceRange: '0 - 90', referenceMin: 0, referenceMax: 90, status: 'outOfRange', time: '2026-03-09' },
      { marker: 'SHBG', value: 26.6, unit: 'nmol/L', referenceRange: '13.3 - 89.5', referenceMin: 13.3, referenceMax: 89.5, status: 'average', time: '2026-03-09' },
      { marker: 'Estrogen', value: 24.1, unit: 'pg/mL', referenceRange: '15 - 32', referenceMin: 15, referenceMax: 32, status: 'optimal', time: '2026-03-09' },
      { marker: 'Ferritin', value: 332, unit: 'ng/mL', referenceRange: '29 - 575', referenceMin: 29, referenceMax: 575, status: 'optimal', time: '2026-03-09' },
      { marker: 'Total Testosterone', value: 287, unit: 'ng/dL', referenceRange: '200 - 800', referenceMin: 200, referenceMax: 800, status: 'average', time: '2026-03-09' },
      { marker: 'Vitamin D', value: 39.8, unit: 'ng/mL', referenceRange: '30 - 80', referenceMin: 30, referenceMax: 80, status: 'average', time: '2026-03-09' },
      { marker: 'Albumin', value: 4.52, unit: 'g/dL', referenceRange: '3.5 - 5.2', referenceMin: 3.5, referenceMax: 5.2, status: 'optimal', time: '2026-03-09' },
      { marker: 'hs-CRP (High-Sensitivity C-Reactive Protein)', value: 2.70, unit: 'mg/L', referenceRange: '0 - 3.0', referenceMin: 0, referenceMax: 3.0, status: 'average', time: '2026-03-09' },
      { marker: 'Total Cholesterol', value: 207, unit: 'mg/dL', referenceRange: '100 - 240', referenceMin: 100, referenceMax: 240, status: 'average', time: '2026-03-09' },
      { marker: 'HDL Cholesterol', value: 28.5, unit: 'mg/dL', referenceRange: '40 - 120', referenceMin: 40, referenceMax: 120, status: 'outOfRange', time: '2026-03-09' },
      { marker: 'Triglycerides', value: 265, unit: 'mg/dL', referenceRange: '0 - 149', referenceMin: 0, referenceMax: 149, status: 'outOfRange', time: '2026-03-09' },
      { marker: 'Free Testosterone', value: 61.72, unit: 'pg/mL', referenceRange: '46 - 224', referenceMin: 46, referenceMax: 224, status: 'average', time: '2026-03-09' },
      { marker: 'LDL Cholesterol', value: 125.5, unit: 'mg/dL', referenceRange: '40 - 150', referenceMin: 40, referenceMax: 150, status: 'average', time: '2026-03-09' },
      { marker: 'LDL/ApoB Ratio', value: 0.95, unit: 'pct', referenceRange: '1.2 - 1.4', referenceMin: 1.2, referenceMax: 1.4, status: 'outOfRange', time: '2026-03-09' },
      { marker: 'Total Cholesterol/HDL Ratio', value: 7.26, unit: 'pct', referenceRange: '3 - 5.1', referenceMin: 3, referenceMax: 5.1, status: 'outOfRange', time: '2026-03-09' },
      { marker: 'Triglycerides/HDL Ratio', value: 9.29, unit: 'pct', referenceRange: '1.25 - 2.5', referenceMin: 1.25, referenceMax: 2.5, status: 'outOfRange', time: '2026-03-09' },
      { marker: 'Remnant Cholesterol', value: 53, unit: 'mg/dL', referenceRange: '20 - 24', referenceMin: 20, referenceMax: 24, status: 'outOfRange', time: '2026-03-09' },
    ],
    rawCsv: 'marker,value,unit,reference_range,status,time\nFree T3,4.25,pg/mL,2 - 4.4,optimal,2026-03-09',
    createdAt: '2026-03-09T10:00:00Z',
  },
];
