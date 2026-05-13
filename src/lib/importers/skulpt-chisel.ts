/**
 * Skulpt Chisel importer. The Skulpt app is discontinued so there is no live API —
 * users typically paste readings as JSON they captured manually:
 *   { "date": "2024-07-20", "overallMQ": 137, "bodyFatPct": 14.1,
 *     "regions": [ { "region": "chest", "mq": 142, "bodyFatPct": 11.5 }, ... ] }
 * Also accepts an array of those objects.
 */

import type { HealthCheckin, RegionalMQ } from '@/lib/api/types';
import type { ImporterResult } from './index';

export interface SkulptResult {
  checkins: Array<Omit<HealthCheckin, 'id' | 'createdAt' | 'tier'>>;
}

export function parseSkulptJson(jsonText: string): ImporterResult<SkulptResult> {
  if (!jsonText.trim()) return { data: null, errors: ['No data provided.'], warnings: [] };
  let parsed: unknown;
  try { parsed = JSON.parse(jsonText); } catch { return { data: null, errors: ['Invalid JSON.'], warnings: [] }; }
  const rows = (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, unknown>[];
  const out: SkulptResult['checkins'] = [];
  for (const r of rows) {
    const date = String(r.date ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
    const regionsRaw = (r.regions ?? r.regionalMQ ?? []) as Array<Record<string, unknown>>;
    const regionalMQ: RegionalMQ[] = Array.isArray(regionsRaw)
      ? regionsRaw.map(reg => ({
          region: String(reg.region ?? reg.name ?? 'unknown'),
          mq: reg.mq !== undefined ? Number(reg.mq) : undefined,
          bodyFatPct: reg.bodyFatPct !== undefined ? Number(reg.bodyFatPct)
            : (reg.body_fat_pct !== undefined ? Number(reg.body_fat_pct) : undefined),
        }))
      : [];
    const overallMQ = r.overallMQ !== undefined ? Number(r.overallMQ)
      : (r.muscleQualityMQ !== undefined ? Number(r.muscleQualityMQ) : undefined);
    const bodyFatPct = r.bodyFatPct !== undefined ? Number(r.bodyFatPct)
      : (r.body_fat_pct !== undefined ? Number(r.body_fat_pct) : undefined);
    out.push({
      date, source: 'skulpt_chisel',
      muscleQualityMQ: overallMQ,
      bodyFatPct,
      regionalMQ: regionalMQ.length ? regionalMQ : undefined,
    });
  }
  if (out.length === 0) return { data: null, errors: ['No Skulpt readings found.'], warnings: [] };
  return { data: { checkins: out }, errors: [], warnings: [] };
}
