/**
 * APT Fitness Coach — React Query Hooks
 * Centralized data fetching with caching, loading states, and cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  exerciseApi, workoutApi, programApi, snapshotApi,
  scheduleApi, sessionApi, performanceApi, adaptiveApi, importApi, bloodPanelApi,
  dailyLogApi, nutritionGoalApi, healthCheckinApi,
} from '@/lib/api';
import type { HealthCheckinFilter } from '@/lib/api/client';
import type { CreateExerciseInput, CreateWorkoutInput, CreateProgramInput, Snapshot, BloodPanel, MealEntry, MealSlot, NutritionGoal, DailyVitals, HealthCheckin } from '@/lib/api/types';

// ============ Query Keys ============

export const queryKeys = {
  exercises: ['exercises'] as const,
  workouts: ['workouts'] as const,
  workout: (id: string) => ['workouts', id] as const,
  programs: ['programs'] as const,
  snapshots: ['snapshots'] as const,
  snapshotCompare: (id: string) => ['snapshots', 'compare', id] as const,
  schedule: ['schedule'] as const,
  sessions: ['sessions'] as const,
  performanceProfiles: ['performanceProfiles'] as const,
  adaptiveRecommendations: ['adaptiveRecommendations'] as const,
  importJobs: ['importJobs'] as const,
  bloodPanels: ['bloodPanels'] as const,
  dailyLog: (date: string) => ['dailyLog', date] as const,
  nutritionGoals: ['nutritionGoals'] as const,
  nutritionGoalActive: (date: string) => ['nutritionGoals', 'active', date] as const,
};

// ============ Exercise Hooks ============

export function useExercises() {
  return useQuery({
    queryKey: queryKeys.exercises,
    queryFn: async () => (await exerciseApi.list()).items,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExerciseInput) => exerciseApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.exercises }); },
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateExerciseInput> }) => exerciseApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.exercises }); },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exerciseApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.exercises }); },
  });
}

// ============ Workout Hooks ============

export function useWorkouts() {
  return useQuery({
    queryKey: queryKeys.workouts,
    queryFn: async () => (await workoutApi.list()).items,
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workout(id!),
    queryFn: () => workoutApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkoutInput) => workoutApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.workouts }); },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateWorkoutInput> }) => workoutApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.workouts }); },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.workouts }); },
  });
}

// ============ Program Hooks ============

export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs,
    queryFn: async () => (await programApi.list()).items,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProgramInput) => programApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.programs }); },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateProgramInput> }) => programApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.programs }); },
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => programApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.programs }); },
  });
}

// ============ Snapshot Hooks ============

export function useSnapshots() {
  return useQuery({
    queryKey: queryKeys.snapshots,
    queryFn: () => snapshotApi.list(),
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Snapshot, 'id' | 'createdAt'>) => snapshotApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.snapshots }); },
  });
}

export function useDeleteSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => snapshotApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.snapshots }); },
  });
}

export function useSnapshotCompare(currentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.snapshotCompare(currentId!),
    queryFn: () => snapshotApi.compare(currentId!, 'last'),
    enabled: !!currentId,
    retry: false,
  });
}

// ============ Schedule Hooks ============

export function useSchedule() {
  return useQuery({
    queryKey: queryKeys.schedule,
    queryFn: () => scheduleApi.list(),
  });
}

export function useCreateScheduleEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof scheduleApi.create>[0]) => scheduleApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.schedule }); },
  });
}

export function useUpdateScheduleEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof scheduleApi.update>[1] }) => scheduleApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.schedule }); },
  });
}

export function useDeleteScheduleEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.schedule }); },
  });
}

// ============ Performance & Adaptive Hooks ============

export function usePerformanceProfiles() {
  return useQuery({
    queryKey: queryKeys.performanceProfiles,
    queryFn: () => performanceApi.listProfiles(),
  });
}

export function useAdaptiveRecommendations() {
  return useQuery({
    queryKey: queryKeys.adaptiveRecommendations,
    queryFn: () => adaptiveApi.getRecommendations(),
  });
}

export function useAnalyzeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => adaptiveApi.analyzeSession(sessionId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.adaptiveRecommendations }); },
  });
}

export function useAnalyzeSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (snapshotId: string) => adaptiveApi.analyzeSnapshot(snapshotId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.adaptiveRecommendations }); },
  });
}

// ============ Session Hooks ============

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof sessionApi.create>[0]) => sessionApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.sessions }); },
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof sessionApi.update>[1] }) =>
      sessionApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions });
      qc.invalidateQueries({ queryKey: ['sessions', vars.id] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.sessions }); },
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionApi.get(id!),
    enabled: !!id,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => sessionApi.list(),
  });
}

// ============ Import Hooks ============

export function useImportJobs() {
  return useQuery({
    queryKey: queryKeys.importJobs,
    queryFn: () => importApi.list(),
  });
}

// ============ Blood Panel Hooks ============

export function useBloodPanels() {
  return useQuery({
    queryKey: queryKeys.bloodPanels,
    queryFn: () => bloodPanelApi.list(),
  });
}

export function useCreateBloodPanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<BloodPanel, 'id' | 'createdAt'>) => bloodPanelApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.bloodPanels }); },
  });
}

export function useDeleteBloodPanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bloodPanelApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.bloodPanels }); },
  });
}

export function useAnalyzeBloodPanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bloodPanelApi.analyze(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bloodPanels });
      qc.invalidateQueries({ queryKey: queryKeys.adaptiveRecommendations });
    },
  });
}

// ============ Daily Log Hooks ============

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: queryKeys.dailyLog(date),
    queryFn: () => dailyLogApi.getByDate(date),
  });
}

export function useAddMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, slot, entry }: { date: string; slot: MealSlot; entry: Omit<MealEntry, 'id' | 'timestamp'> }) =>
      dailyLogApi.addMeal(date, slot, entry),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: queryKeys.dailyLog(vars.date) }); },
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, slot, mealId }: { date: string; slot: MealSlot; mealId: string }) =>
      dailyLogApi.deleteMeal(date, slot, mealId),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: queryKeys.dailyLog(vars.date) }); },
  });
}

export function useLogWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, weight }: { date: string; weight: number }) =>
      dailyLogApi.updateWeight(date, weight),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: queryKeys.dailyLog(vars.date) }); },
  });
}

export function useUpdateDailyVitals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, vitals }: { date: string; vitals: DailyVitals }) =>
      dailyLogApi.updateVitals(date, vitals),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: queryKeys.dailyLog(vars.date) }); },
  });
}

// ============ Nutrition Goal Hooks ============

export function useNutritionGoals() {
  return useQuery({
    queryKey: queryKeys.nutritionGoals,
    queryFn: () => nutritionGoalApi.list(),
  });
}

export function useActiveNutritionGoal(date: string) {
  return useQuery({
    queryKey: queryKeys.nutritionGoalActive(date),
    queryFn: () => nutritionGoalApi.getActive(date),
  });
}

export function useCreateNutritionGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<NutritionGoal, 'id' | 'createdAt'>) => nutritionGoalApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutritionGoals });
      qc.invalidateQueries({ queryKey: ['nutritionGoals'] });
    },
  });
}
