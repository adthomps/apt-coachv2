/**
 * Lumen importer (BETA — pending sample export).
 * Accepts either:
 *   - Array of { date, level (1–5), morningLevel?, flexScore?, notes? }
 *   - Lumen-style export shape with `measurements: [{date, level, type}]`
 */

import type { HealthCheckin, LumenLevel } from '@/lib/api/types';
import type { ImporterResult } from './index';

export interface LumenResult {
  checkins: Array<Omit<HealthCheckin, 'id' | 'createdAt' | 'tier'>>;
}

function clampLevel(n: number): LumenLevel | undefined {
  const v = Math.round(n);
  return v >= 1 && v <= 5 ? (v as LumenLevel) : undefined;
}

export function parseLumenJson(jsonText: string): ImporterResult<LumenResult> {
  if (!jsonText.trim()) return { data: null, errors: ['No data provided.'], warnings: [] };
  let parsed: unknown;
  try { parsed = JSON.parse(jsonText); } catch { return { data: null, errors: ['Invalid JSON.'], warnings: [] }; }

  // Support {measurements:[]} envelope
  if (parsed && typeof parsed === 'object' && 'measurements' in parsed) {
    parsed = (parsed as { measurements: unknown }).measurements;
  }
  if (!Array.isArray(parsed)) return { data: null, errors: ['Expected an array of Lumen measurements.'], warnings: [] };

  // Group by date — first measurement of the day is "morning", the highest of the day is daily peak.
  const byDate = new Map<string, { morning?: LumenLevel; peak?: LumenLevel; flex?: number; notes?: string }>();
  for (const row of parsed as Record<string, unknown>[]) {
    const date = String(row.date ?? row.timestamp ?? '').slice(0, 10);
    if (!date) continue;
    const level = clampLevel(Number(row.level ?? row.value));
    if (level === undefined) continue;
    const slot = byDate.get(date) ?? {};
    if (slot.morning === undefined) slot.morning = level;
    slot.peak = slot.peak === undefined ? level : (Math.max(slot.peak, level) as LumenLevel);
    if (row.flexScore !== undefined) slot.flex = Number(row.flexScore);
    if (row.notes) slot.notes = String(row.notes);
    byDate.set(date, slot);
  }

  const out: LumenResult['checkins'] = [];
  for (const [date, slot] of byDate.entries()) {
    out.push({
      date, source: 'lumen',
      morningLumenLevel: slot.morning,
      lumenLevel: slot.peak,
      metabolicFlexScore: slot.flex,
      notes: slot.notes,
    });
  }

  if (out.length === 0) return { data: null, errors: ['No valid Lumen readings parsed.'], warnings: [] };
  return { data: { checkins: out }, errors: [], warnings: ['Lumen importer is in beta — paste a sample export to firm up the schema.'] };
}
