/**
 * APT Fitness Coach — API Client (Mock)
 * Designed for easy migration to Cloudflare Workers + Hono + D1
 */

import type {
  Exercise, CreateExerciseInput,
  Workout, CreateWorkoutInput, WorkoutBlock,
  Program, CreateProgramInput,
  Snapshot, ProgressCompare,
  ImportPreview, ImportJob, ImportType,
  PaginatedResponse,
  WorkoutSession, SessionExerciseLog,
  ScheduleEntry,
  ExercisePerformanceProfile,
  AdaptiveRecommendation,
  BloodPanel,
} from './types';
import {
  mockExercises, mockWorkouts, mockPrograms, mockSnapshots, mockImportJobs,
  mockSessions, mockScheduleEntries, mockPerformanceProfiles, mockAdaptiveRecommendations,
  mockBloodPanels,
} from './mock-data';
import { evaluateSession, evaluateSnapshot, evaluateSchedule } from '@/lib/adaptive-engine';
import { evaluateBloodPanel } from '@/lib/blood-marker-engine';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============ Exercise API ============

export const exerciseApi = {
  async list(cursor?: string): Promise<PaginatedResponse<Exercise>> {
    await delay(200);
    const start = cursor ? parseInt(cursor) : 0;
    const items = mockExercises.slice(start, start + 50);
    return { items, nextCursor: start + 50 < mockExercises.length ? String(start + 50) : undefined };
  },
  async get(id: string): Promise<Exercise | null> {
    await delay(100);
    return mockExercises.find(e => e.id === id) || null;
  },
  async create(input: CreateExerciseInput): Promise<Exercise> {
    await delay(300);
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const ex: Exercise = { id: `ex_${Date.now()}`, slug, ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    mockExercises.push(ex);
    return ex;
  },
  async update(id: string, input: Partial<CreateExerciseInput>): Promise<Exercise> {
    await delay(300);
    const i = mockExercises.findIndex(e => e.id === id);
    if (i === -1) throw new Error('Exercise not found');
    mockExercises[i] = { ...mockExercises[i], ...input, updatedAt: new Date().toISOString() };
    return mockExercises[i];
  },
  async delete(id: string): Promise<void> {
    await delay(200);
    const i = mockExercises.findIndex(e => e.id === id);
    if (i !== -1) mockExercises.splice(i, 1);
  },
};

// ============ Workout API ============

export const workoutApi = {
  async list(cursor?: string): Promise<PaginatedResponse<Workout>> {
    await delay(200);
    const start = cursor ? parseInt(cursor) : 0;
    const items = mockWorkouts.slice(start, start + 20);
    return { items, nextCursor: start + 20 < mockWorkouts.length ? String(start + 20) : undefined };
  },
  async get(id: string): Promise<Workout | null> {
    await delay(100);
    return mockWorkouts.find(w => w.id === id) || null;
  },
  async create(input: CreateWorkoutInput): Promise<Workout> {
    await delay(300);
    const blocks: WorkoutBlock[] = input.blocks.map((b, i) => ({
      ...b, id: `blk_${Date.now()}_${i}`,
      items: b.items.map((item, j) => ({ ...item, id: `bi_${Date.now()}_${i}_${j}` })),
    }));
    const w: Workout = { id: `wk_${Date.now()}`, ...input, blocks, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    mockWorkouts.push(w);
    return w;
  },
  async update(id: string, input: Partial<CreateWorkoutInput>): Promise<Workout> {
    await delay(300);
    const i = mockWorkouts.findIndex(w => w.id === id);
    if (i === -1) throw new Error('Workout not found');
    const existing = mockWorkouts[i];
    const updatedBlocks = input.blocks
      ? input.blocks.map((b, bi) => ({ ...b, id: `blk_${Date.now()}_${bi}`, items: b.items.map((item, j) => ({ ...item, id: `bi_${Date.now()}_${bi}_${j}` })) }))
      : existing.blocks;
    mockWorkouts[i] = { ...existing, ...input, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
    return mockWorkouts[i];
  },
  async delete(id: string): Promise<void> {
    await delay(200);
    const i = mockWorkouts.findIndex(w => w.id === id);
    if (i !== -1) mockWorkouts.splice(i, 1);
  },
};

// ============ Program API ============

export const programApi = {
  async list(cursor?: string): Promise<PaginatedResponse<Program>> {
    await delay(200);
    const start = cursor ? parseInt(cursor) : 0;
    const items = mockPrograms.slice(start, start + 20);
    return { items, nextCursor: start + 20 < mockPrograms.length ? String(start + 20) : undefined };
  },
  async get(id: string): Promise<Program | null> {
    await delay(100);
    return mockPrograms.find(p => p.id === id) || null;
  },
  async create(input: CreateProgramInput): Promise<Program> {
    await delay(300);
    const p: Program = {
      id: `prog_${Date.now()}`, ...input,
      days: input.days.map((d, i) => ({ ...d, id: `pd_${Date.now()}_${i}` })),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mockPrograms.push(p);
    return p;
  },
  async update(id: string, input: Partial<CreateProgramInput>): Promise<Program> {
    await delay(300);
    const i = mockPrograms.findIndex(p => p.id === id);
    if (i === -1) throw new Error('Program not found');
    const existing = mockPrograms[i];
    const updatedDays = input.days
      ? input.days.map((d, di) => ({ ...d, id: `pd_${Date.now()}_${di}` }))
      : existing.days;
    mockPrograms[i] = { ...existing, ...input, days: updatedDays, updatedAt: new Date().toISOString() };
    return mockPrograms[i];
  },
  async delete(id: string): Promise<void> {
    await delay(200);
    const i = mockPrograms.findIndex(p => p.id === id);
    if (i !== -1) mockPrograms.splice(i, 1);
  },
};

// ============ Snapshot API ============

export const snapshotApi = {
  async list(): Promise<Snapshot[]> {
    await delay(200);
    return [...mockSnapshots].sort((a, b) => b.scanDate.localeCompare(a.scanDate));
  },
  async get(id: string): Promise<Snapshot | null> {
    await delay(100);
    return mockSnapshots.find(s => s.id === id) || null;
  },
  async getLatest(): Promise<Snapshot | null> {
    await delay(100);
    const sorted = [...mockSnapshots].sort((a, b) => b.scanDate.localeCompare(a.scanDate));
    return sorted[0] || null;
  },
  async create(snap: Omit<Snapshot, 'id' | 'createdAt'>): Promise<Snapshot> {
    await delay(300);
    const s: Snapshot = { id: `snap_${Date.now()}`, ...snap, createdAt: new Date().toISOString() };
    mockSnapshots.push(s);
    return s;
  },
  async update(id: string, input: Partial<Pick<Snapshot, 'notes' | 'provider'>>): Promise<Snapshot> {
    await delay(200);
    const i = mockSnapshots.findIndex(s => s.id === id);
    if (i === -1) throw new Error('Snapshot not found');
    mockSnapshots[i] = { ...mockSnapshots[i], ...input };
    return mockSnapshots[i];
  },
  async delete(id: string): Promise<void> {
    await delay(200);
    const i = mockSnapshots.findIndex(s => s.id === id);
    if (i !== -1) mockSnapshots.splice(i, 1);
  },
  async compare(currentId: string, previousId: string | 'last'): Promise<ProgressCompare> {
    await delay(300);
    const current = mockSnapshots.find(s => s.id === currentId);
    if (!current) throw new Error('Current snapshot not found');
    let previous: Snapshot | undefined;
    if (previousId === 'last') {
      previous = [...mockSnapshots].filter(s => s.id !== currentId && s.scanDate < current.scanDate).sort((a, b) => b.scanDate.localeCompare(a.scanDate))[0];
    } else {
      previous = mockSnapshots.find(s => s.id === previousId);
    }
    if (!previous) throw new Error('Previous snapshot not found');
    const c = current.bodyComposition, p = previous.bodyComposition;
    return {
      currentSnapshot: current, previousSnapshot: previous,
      changes: {
        totalMass: { value: c.totalMass - p.totalMass, percentage: ((c.totalMass - p.totalMass) / p.totalMass) * 100 },
        fatMass: { value: c.fatMass - p.fatMass, percentage: ((c.fatMass - p.fatMass) / p.fatMass) * 100 },
        leanMass: { value: c.leanMass - p.leanMass, percentage: ((c.leanMass - p.leanMass) / p.leanMass) * 100 },
        bodyFatPercentage: { value: c.bodyFatPercentage - p.bodyFatPercentage, percentage: ((c.bodyFatPercentage - p.bodyFatPercentage) / p.bodyFatPercentage) * 100 },
        regionalChanges: current.regionalData.map(r => {
          const pr = previous!.regionalData.find(x => x.region === r.region);
          return { region: r.region, fatChange: pr ? r.fatMass - pr.fatMass : 0, leanChange: pr ? r.leanMass - pr.leanMass : 0 };
        }),
      },
      timeSpanDays: Math.floor((new Date(current.scanDate).getTime() - new Date(previous.scanDate).getTime()) / 86400000),
    };
  },
};

// ============ Import API ============

export const importApi = {
  async preview(type: ImportType, data: unknown): Promise<ImportPreview> {
    await delay(500);
    const items = Array.isArray(data) ? data : [data];
    return {
      type, schemaVersion: '1.0', totalItems: items.length, adds: items.length, updates: 0, skips: 0, errors: 0,
      items: items.map((item, i) => ({ index: i, action: 'add' as const, name: item.name || `Item ${i + 1}`, data: item })),
      isValid: true,
    };
  },
  async commit(type: ImportType, data: unknown): Promise<ImportJob> {
    await delay(800);
    const items = Array.isArray(data) ? data : [data];
    const job: ImportJob = { id: `import_${Date.now()}`, type, status: 'completed', totalItems: items.length, processedItems: items.length, successItems: items.length, failedItems: 0, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() };
    mockImportJobs.push(job);
    return job;
  },
  async list(): Promise<ImportJob[]> {
    await delay(200);
    return [...mockImportJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

// ============ Session API ============

export const sessionApi = {
  async list(): Promise<WorkoutSession[]> {
    await delay(200);
    return [...mockSessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async get(id: string): Promise<WorkoutSession | null> {
    await delay(100);
    return mockSessions.find(s => s.id === id) || null;
  },
  async create(input: Omit<WorkoutSession, 'id' | 'createdAt'>): Promise<WorkoutSession> {
    await delay(300);
    const session: WorkoutSession = { id: `sess_${Date.now()}`, ...input, createdAt: new Date().toISOString() };
    mockSessions.push(session);
    return session;
  },
  async update(id: string, input: Partial<Pick<WorkoutSession, 'status' | 'notes' | 'completedAt'>>): Promise<WorkoutSession> {
    await delay(200);
    const i = mockSessions.findIndex(s => s.id === id);
    if (i === -1) throw new Error('Session not found');
    mockSessions[i] = { ...mockSessions[i], ...input };
    return mockSessions[i];
  },
  async delete(id: string): Promise<void> {
    await delay(200);
    const i = mockSessions.findIndex(s => s.id === id);
    if (i !== -1) mockSessions.splice(i, 1);
  },
};

// ============ Schedule API ============

export const scheduleApi = {
  async list(): Promise<ScheduleEntry[]> {
    await delay(200);
    return [...mockScheduleEntries].sort((a, b) => b.date.localeCompare(a.date));
  },
  async create(input: Omit<ScheduleEntry, 'id' | 'createdAt'>): Promise<ScheduleEntry> {
    await delay(200);
    const entry: ScheduleEntry = { id: `sched_${Date.now()}`, ...input, createdAt: new Date().toISOString() };
    mockScheduleEntries.push(entry);
    return entry;
  },
  async update(id: string, input: Partial<ScheduleEntry>): Promise<ScheduleEntry> {
    await delay(200);
    const i = mockScheduleEntries.findIndex(e => e.id === id);
    if (i === -1) throw new Error('Schedule entry not found');
    mockScheduleEntries[i] = { ...mockScheduleEntries[i], ...input };
    return mockScheduleEntries[i];
  },
  async delete(id: string): Promise<void> {
    await delay(200);
    const i = mockScheduleEntries.findIndex(e => e.id === id);
    if (i !== -1) mockScheduleEntries.splice(i, 1);
  },
};

// ============ Performance API ============

export const performanceApi = {
  async getProfile(exerciseId: string): Promise<ExercisePerformanceProfile | null> {
    await delay(100);
    return mockPerformanceProfiles.find(p => p.exerciseId === exerciseId) || null;
  },
  async listProfiles(): Promise<ExercisePerformanceProfile[]> {
    await delay(200);
    return [...mockPerformanceProfiles];
  },
};

// ============ Adaptive API ============

export const adaptiveApi = {
  async getRecommendations(): Promise<AdaptiveRecommendation[]> {
    await delay(200);
    return [...mockAdaptiveRecommendations].sort((a, b) => b.confidenceScore - a.confidenceScore);
  },
  async analyzeSession(sessionId: string): Promise<AdaptiveRecommendation[]> {
    await delay(500);
    const session = mockSessions.find(s => s.id === sessionId);
    if (!session) return [];
    const recs = evaluateSession(session, mockPerformanceProfiles);
    mockAdaptiveRecommendations.push(...recs);
    return recs;
  },
  async analyzeSnapshot(snapshotId: string): Promise<AdaptiveRecommendation[]> {
    await delay(500);
    const snapshot = mockSnapshots.find(s => s.id === snapshotId);
    if (!snapshot) return [];
    try {
      const sorted = [...mockSnapshots].sort((a, b) => b.scanDate.localeCompare(a.scanDate));
      const idx = sorted.findIndex(s => s.id === snapshotId);
      if (idx < sorted.length - 1) {
        const compare = await snapshotApi.compare(snapshotId, sorted[idx + 1].id);
        const recs = evaluateSnapshot(snapshot, compare, mockPerformanceProfiles);
        mockAdaptiveRecommendations.push(...recs);
        return recs;
      }
    } catch { /* first snapshot, no comparison */ }
    return [];
  },
};

// ============ Blood Panel API ============

export const bloodPanelApi = {
  async list(): Promise<BloodPanel[]> {
    await delay(200);
    return [...mockBloodPanels].sort((a, b) => b.panelDate.localeCompare(a.panelDate));
  },
  async get(id: string): Promise<BloodPanel | null> {
    await delay(100);
    return mockBloodPanels.find(p => p.id === id) || null;
  },
  async create(input: Omit<BloodPanel, 'id' | 'createdAt'>): Promise<BloodPanel> {
    await delay(300);
    const panel: BloodPanel = { id: `bp_${Date.now()}`, ...input, createdAt: new Date().toISOString() };
    mockBloodPanels.push(panel);
    return panel;
  },
  async delete(id: string): Promise<void> {
    await delay(200);
    const i = mockBloodPanels.findIndex(p => p.id === id);
    if (i !== -1) mockBloodPanels.splice(i, 1);
  },
  async analyze(id: string): Promise<AdaptiveRecommendation[]> {
    await delay(500);
    const panel = mockBloodPanels.find(p => p.id === id);
    if (!panel) return [];
    const recs = evaluateBloodPanel(panel);
    mockAdaptiveRecommendations.push(...recs);
    return recs;
  },
};
