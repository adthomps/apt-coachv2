/**
 * APT Fitness Coach — Zod Validation Schemas
 * Runtime validation for all CreateInput types.
 */

import { z } from 'zod';

// ============ Shared Enums ============

export const movementPatternSchema = z.enum([
  'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull',
  'hip_hinge', 'knee_dominant', 'core', 'isolation',
]);

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const blockTypeSchema = z.enum([
  'straight_sets', 'superset', 'giant_set', 'six_twelve_twentyfive', 'drop_set',
]);

export const programGoalSchema = z.enum([
  'strength', 'hypertrophy', 'endurance', 'recomposition', 'general_fitness',
]);

// ============ Exercise ============

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  slug: z.string().trim().optional(),
  movementPattern: movementPatternSchema,
  muscleGroups: z.array(z.string().trim().min(1)).min(1, 'At least one muscle group is required'),
  equipment: z.array(z.string().trim().min(1)).min(1, 'At least one equipment type is required'),
  difficulty: difficultySchema,
  description: z.string().trim().max(500).optional(),
  instructions: z.array(z.string().trim()).optional(),
  cues: z.array(z.string().trim()).optional(),
  substitutions: z.array(z.string().trim()).optional(),
});

export type CreateExerciseFormData = z.infer<typeof createExerciseSchema>;

// ============ Workout ============

export const workoutBlockItemSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(20),
  repsMin: z.number().int().min(1).max(100),
  repsMax: z.number().int().min(1).max(100),
  restSeconds: z.number().int().min(0).max(600),
  rpeTarget: z.number().min(1).max(10).optional(),
  notes: z.string().trim().max(200).optional(),
  order: z.number().int().min(0),
});

export const workoutBlockSchema = z.object({
  name: z.string().trim().min(1, 'Block name is required'),
  type: blockTypeSchema,
  items: z.array(workoutBlockItemSchema),
  rounds: z.number().int().min(1).optional(),
  notes: z.string().trim().max(200).optional(),
  order: z.number().int().min(0),
});

export const createWorkoutSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().trim().max(500).optional(),
  difficulty: difficultySchema,
  estimatedDuration: z.number().int().min(10, 'Minimum 10 minutes').max(180, 'Maximum 180 minutes'),
  blocks: z.array(workoutBlockSchema),
  tags: z.array(z.string().trim()).optional(),
});

export type CreateWorkoutFormData = z.infer<typeof createWorkoutSchema>;

// ============ Program ============

export const programDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  workoutId: z.string().optional(),
  isRestDay: z.boolean(),
  notes: z.string().trim().max(200).optional(),
});

export const createProgramSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().trim().max(500).optional(),
  durationWeeks: z.number().int().min(1, 'Minimum 1 week').max(52, 'Maximum 52 weeks'),
  goal: programGoalSchema,
  difficulty: difficultySchema,
  days: z.array(programDaySchema),
});

export type CreateProgramFormData = z.infer<typeof createProgramSchema>;

// ============ Snapshot Import ============

export const snapshotImportSchema = z.object({
  scanDate: z.string().min(1, 'Scan date is required'),
  provider: z.string().optional(),
  totalMass: z.number().positive('Total mass must be positive'),
  fatMass: z.number().positive('Fat mass must be positive'),
  leanMass: z.number().positive('Lean mass must be positive'),
  boneMass: z.number().positive('Bone mass must be positive'),
  bodyFatPct: z.number().min(1, 'Body fat % must be at least 1').max(60, 'Body fat % must be at most 60'),
});

export type SnapshotImportFormData = z.infer<typeof snapshotImportSchema>;
