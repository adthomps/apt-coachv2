/**
 * Withings BeamO importer (BETA — sample export not yet available).
 * Accepts a JSON array of {date, tempF, spo2, ecg, systolic?, diastolic?, notes?}
 * or a single reading object. Use for stethoscope, ECG, SpO2, temperature.
 */

import type { EcgRhythm, HealthCheckin } from '@/lib/api/types';
import type { ImporterResult } from './index';

export interface WithingsBeamoResult {
  checkins: Array<Omit<HealthCheckin, 'id' | 'createdAt' | 'tier'>>;
}

const VALID_ECG: EcgRhythm[] = ['normal', 'afib', 'inconclusive'];

export function parseWithingsBeamoJson(jsonText: string): ImporterResult<WithingsBeamoResult> {
  if (!jsonText.trim()) return { data: null, errors: ['No data provided.'], warnings: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { data: null, errors: ['Invalid JSON.'], warnings: [] };
  }
  const rows = (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, unknown>[];
  const out: WithingsBeamoResult['checkins'] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const r of rows) {
    const date = String(r.date ?? r.timestamp ?? today).slice(0, 10);
    const ecgRaw = r.ecg ? String(r.ecg).toLowerCase() : undefined;
    const ecg = ecgRaw && VALID_ECG.includes(ecgRaw as EcgRhythm) ? (ecgRaw as EcgRhythm) : undefined;
    out.push({
      date, source: 'withings_beamo',
      bodyTempF: r.tempF !== undefined ? Number(r.tempF) : (r.temp_f !== undefined ? Number(r.temp_f) : undefined),
      bloodOxygenPct: r.spo2 !== undefined ? Number(r.spo2) : undefined,
      ecgRhythm: ecg,
      systolicMmHg: r.systolic !== undefined ? Number(r.systolic) : undefined,
      diastolicMmHg: r.diastolic !== undefined ? Number(r.diastolic) : undefined,
      stethoscopeNotes: r.stethoscope ? String(r.stethoscope) : undefined,
      notes: r.notes ? String(r.notes) : undefined,
    });
  }
  if (out.length === 0) return { data: null, errors: ['No valid readings parsed.'], warnings: [] };
  return { data: { checkins: out }, errors: [], warnings: ['BeamO importer is in beta — paste a sample export to firm up the schema.'] };
}
