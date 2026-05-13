/**
 * Withings Body / Body Scan CSV importer.
 * Withings exports columns like:
 *   Date,Weight (kg),Fat mass (kg),Bone mass (kg),Muscle mass (kg),Hydration (kg)
 * Some accounts label headers in lbs. We auto-detect units and convert to lbs.
 */

import type { HealthCheckin } from '@/lib/api/types';
import type { ImporterResult } from './index';

const KG_TO_LBS = 2.20462;

export interface WithingsScaleResult {
  checkins: Array<Omit<HealthCheckin, 'id' | 'createdAt' | 'tier'>>;
  rowCount: number;
}

interface ColMap {
  date: number;
  weight: number;
  fat: number;
  bone: number;
  muscle: number;
  hydration: number;
  fatPct: number;
}

function findCol(header: string[], ...candidates: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = header[i].toLowerCase();
    if (candidates.some(c => h.includes(c))) return i;
  }
  return -1;
}

export function parseWithingsScaleCsv(csvText: string): ImporterResult<WithingsScaleResult> {
  if (!csvText.trim()) return { data: null, errors: ['No data provided.'], warnings: [] };
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { data: null, errors: ['Need a header row + at least one reading.'], warnings: [] };

  const header = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  const cols: ColMap = {
    date: findCol(header, 'date'),
    weight: findCol(header, 'weight'),
    fat: findCol(header, 'fat mass'),
    bone: findCol(header, 'bone'),
    muscle: findCol(header, 'muscle'),
    hydration: findCol(header, 'hydration', 'water'),
    fatPct: findCol(header, 'fat ratio', 'fat %', 'body fat'),
  };
  if (cols.date < 0 || cols.weight < 0) {
    return { data: null, errors: ['CSV must include at least Date and Weight columns.'], warnings: [] };
  }

  const useKg = /\bkg\b/i.test(header[cols.weight] || '');
  const warnings: string[] = [];
  if (useKg) warnings.push('Detected kg — converted to lbs.');

  const checkins: WithingsScaleResult['checkins'] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const parts = raw.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const dateRaw = parts[cols.date];
    const date = dateRaw ? dateRaw.slice(0, 10) : '';
    const weight = parseFloat(parts[cols.weight]);
    if (!date || Number.isNaN(weight)) continue;

    const conv = (v: number) => (useKg ? v * KG_TO_LBS : v);
    const fat = cols.fat >= 0 ? parseFloat(parts[cols.fat]) : NaN;
    const muscle = cols.muscle >= 0 ? parseFloat(parts[cols.muscle]) : NaN;
    const hydration = cols.hydration >= 0 ? parseFloat(parts[cols.hydration]) : NaN;
    const fatPctDirect = cols.fatPct >= 0 ? parseFloat(parts[cols.fatPct]) : NaN;

    const weightLbs = Number(conv(weight).toFixed(1));
    const fatMassLbs = Number.isFinite(fat) ? Number(conv(fat).toFixed(1)) : undefined;
    const leanMassLbs = Number.isFinite(muscle) ? Number(conv(muscle).toFixed(1)) : undefined;
    const bodyFatPct = Number.isFinite(fatPctDirect)
      ? Number(fatPctDirect.toFixed(1))
      : Number.isFinite(fat)
        ? Number(((conv(fat) / weightLbs) * 100).toFixed(1))
        : undefined;
    const waterPct = Number.isFinite(hydration)
      ? Number(((conv(hydration) / weightLbs) * 100).toFixed(1))
      : undefined;

    checkins.push({
      date, source: 'withings_scale',
      weightLbs, fatMassLbs, leanMassLbs, bodyFatPct, waterPct,
    });
  }

  if (checkins.length === 0) return { data: null, errors: ['No valid rows found.'], warnings };
  return { data: { checkins, rowCount: checkins.length }, errors: [], warnings };
}
