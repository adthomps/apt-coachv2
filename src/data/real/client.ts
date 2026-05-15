/**
 * APT Layer: data/real
 * --------------------
 * Dormant shell. When `USE_MOCK_API` flips to false in `http-client.ts`,
 * each method below must be implemented against the Cloudflare Worker
 * (Hono routes at `/api/*`).
 *
 * The interface mirrors `src/lib/api/client.ts` (mock client) one-to-one.
 * Cutover plan:
 *   1. Stand up the Worker with route stubs returning fixtures.
 *   2. Swap one resource at a time here, leaving the rest mock-backed.
 *   3. When all resources are real, delete `src/data/mock/` re-exports.
 */
import { apiFetch } from '@/lib/api/http-client';

const NOT_IMPLEMENTED = (name: string) => () => {
  throw new Error(
    `[data/real] ${name} is not implemented yet. ` +
    `Set USE_MOCK_API=true in http-client.ts or implement the Worker route.`
  );
};

export const realClient = {
  // Resource shells — mirror mock client surface
  exercise: { list: NOT_IMPLEMENTED('exercise.list') },
  workout:  { list: NOT_IMPLEMENTED('workout.list') },
  program:  { list: NOT_IMPLEMENTED('program.list') },
  snapshot: { list: NOT_IMPLEMENTED('snapshot.list') },
  schedule: { list: NOT_IMPLEMENTED('schedule.list') },
  bloodPanel: { list: NOT_IMPLEMENTED('bloodPanel.list') },
  dailyLog: { get: NOT_IMPLEMENTED('dailyLog.get') },
  // ...extend as routes come online
  _apiFetch: apiFetch,
};

export type RealClient = typeof realClient;
