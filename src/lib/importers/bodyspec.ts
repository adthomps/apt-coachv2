/**
 * BodySpec / DEXA scan importer.
 * Accepts JSON in either lbs or kg, returns canonical Snapshot input (lbs).
 */

import type { Snapshot } from '@/lib/api/types';
import { snapshotImportSchema } from '@/lib/validations';
import type { ImporterResult } from './index';

const KG_TO_LBS = 2.20462;

export interface BodyspecResult {
  snapshotInput: Omit<Snapshot, 'id' | 'createdAt'>;
}

export function parseBodyspecJson(jsonText: string): ImporterResult<BodyspecResult> {
  if (!jsonText.trim()) {
    return { data: null, errors: ['No data provided.'], warnings: [] };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { data: null, errors: ['Invalid JSON. Check formatting.'], warnings: [] };
  }

  const date = (parsed.scan_date || parsed.scanDate || new Date().toISOString().split('T')[0]) as string;
  const provider = (parsed.source || parsed.provider || 'BodySpec') as string;
  const bc = (parsed.body_composition || parsed) as Record<string, number>;

  const warnings: string[] = [];

  let totalMass = bc.total_mass_lbs ?? bc.totalMass;
  let fatMass = bc.fat_mass_lbs ?? bc.fatMass;
  let leanMass = bc.lean_mass_lbs ?? bc.leanMass;
  let boneMass = bc.bone_mass_lbs ?? bc.boneMass;

  if (totalMass == null && (bc.total_mass_kg != null || bc.weight != null)) {
    warnings.push('Detected kg values — auto-converted to lbs.');
    totalMass = (bc.total_mass_kg ?? bc.weight) * KG_TO_LBS;
    fatMass = (bc.fat_mass_kg ?? 0) * KG_TO_LBS;
    leanMass = (bc.lean_mass_kg ?? 0) * KG_TO_LBS;
    boneMass = (bc.bone_mass_kg ?? 3.0) * KG_TO_LBS;
  }

  const candidate = {
    scanDate: date,
    provider,
    totalMass: totalMass ? Number(totalMass.toFixed(1)) : 0,
    fatMass: fatMass ? Number(fatMass.toFixed(1)) : 0,
    leanMass: leanMass ? Number(leanMass.toFixed(1)) : 0,
    boneMass: boneMass ? Number(boneMass.toFixed(1)) : 0,
    bodyFatPct: (bc.body_fat_pct ?? bc.bodyFatPercentage) as number,
  };

  const validated = snapshotImportSchema.safeParse(candidate);
  if (!validated.success) {
    return {
      data: null,
      errors: validated.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      warnings,
    };
  }

  const v = validated.data;
  return {
    data: {
      snapshotInput: {
        scanDate: v.scanDate,
        provider: v.provider,
        bodyComposition: {
          totalMass: v.totalMass,
          fatMass: v.fatMass,
          leanMass: v.leanMass,
          boneMass: v.boneMass,
          bodyFatPercentage: v.bodyFatPct,
        },
        regionalData: [],
        rawJson: jsonText,
      },
    },
    errors: [],
    warnings,
  };
}
