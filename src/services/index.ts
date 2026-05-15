/**
 * APT Layer: services
 * -------------------
 * Frontend service layer. The ONLY allowed callers of `@/data` besides
 * `@/hooks/use-api-queries`. Pages and components must consume services
 * (or React Query hooks that wrap services), never the data client directly.
 *
 * Today services are thin pass-throughs to the api object; they exist so
 * pages depend on a stable contract while the backend evolves.
 */
import {
  exerciseApi, workoutApi, programApi, snapshotApi,
  scheduleApi, performanceApi, adaptiveApi, importApi, bloodPanelApi,
  dailyLogApi, nutritionGoalApi, healthCheckinApi,
} from '@/lib/api';

export const healthService    = { snapshot: snapshotApi, bloodPanel: bloodPanelApi, checkin: healthCheckinApi };
export const trainingService  = { exercise: exerciseApi, workout: workoutApi, program: programApi, performance: performanceApi, adaptive: adaptiveApi };
export const scheduleService  = { entries: scheduleApi };
export const nutritionService = { dailyLog: dailyLogApi, goal: nutritionGoalApi };
export const importService    = { jobs: importApi };
