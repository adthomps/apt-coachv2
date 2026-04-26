/**
 * Generic JSON-array importer for exercises / workouts / programs.
 * Produces an array of unknown items for downstream importApi.preview/commit.
 */

import type { ImporterResult } from './index';

export function parseEntityArrayJson(jsonText: string): ImporterResult<unknown[]> {
  if (!jsonText.trim()) {
    return { data: null, errors: ['No data provided.'], warnings: [] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { data: null, errors: ['Invalid JSON. Check formatting.'], warnings: [] };
  }
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) {
    return { data: null, errors: ['Array contains no items.'], warnings: [] };
  }
  return { data: arr, errors: [], warnings: [] };
}
