/**
 * Apple Health vitals importer.
 * Accepts a JSON array of HealthKit records (already extracted from export.zip),
 * each shaped like:
 *   { type: "HKQuantityTypeIdentifierOxygenSaturation", value: 0.97, startDate: "2024-07-22T08:00:00Z", unit?: "%" }
 * One HealthCheckin per (date, type-bucket).
 */

import type { HealthCheckin } from '@/lib/api/types';
import type { ImporterResult } from './index';

export interface AppleHealthVitalsResult {
  checkins: Array<Omit<HealthCheckin, 'id' | 'createdAt' | 'tier'>>;
}

interface DayBucket {
  bloodOxygenPct?: number[];
  pulseBpm?: number[];
  bodyTempF?: number[];
  systolicMmHg?: number[];
  diastolicMmHg?: number[];
  steps?: number;
  respiratoryRate?: number[];
}

function avg(arr?: number[]) {
  if (!arr || arr.length === 0) return undefined;
  return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
}

export function parseAppleHealthVitalsJson(jsonText: string): ImporterResult<AppleHealthVitalsResult> {
  if (!jsonText.trim()) return { data: null, errors: ['No data provided.'], warnings: [] };
  let parsed: unknown;
  try { parsed = JSON.parse(jsonText); } catch { return { data: null, errors: ['Invalid JSON.'], warnings: [] }; }
  // Accept {records:[]} envelope (Apple Health JSON exporter style)
  if (parsed && typeof parsed === 'object' && 'records' in parsed) parsed = (parsed as { records: unknown }).records;
  if (!Array.isArray(parsed)) return { data: null, errors: ['Expected an array of HealthKit records.'], warnings: [] };

  const byDate = new Map<string, DayBucket>();
  let unknown = 0;

  for (const row of parsed as Record<string, unknown>[]) {
    const dateStr = String(row.startDate ?? row.date ?? '').slice(0, 10);
    if (!dateStr) continue;
    const type = String(row.type ?? '');
    const valueRaw = Number(row.value);
    if (Number.isNaN(valueRaw)) continue;
    const slot = byDate.get(dateStr) ?? {};
    switch (type) {
      case 'HKQuantityTypeIdentifierOxygenSaturation':
        (slot.bloodOxygenPct ??= []).push(valueRaw <= 1 ? valueRaw * 100 : valueRaw); break;
      case 'HKQuantityTypeIdentifierHeartRate':
      case 'HKQuantityTypeIdentifierRestingHeartRate':
        (slot.pulseBpm ??= []).push(valueRaw); break;
      case 'HKQuantityTypeIdentifierBodyTemperature':
        (slot.bodyTempF ??= []).push(valueRaw); break;
      case 'HKQuantityTypeIdentifierBloodPressureSystolic':
        (slot.systolicMmHg ??= []).push(valueRaw); break;
      case 'HKQuantityTypeIdentifierBloodPressureDiastolic':
        (slot.diastolicMmHg ??= []).push(valueRaw); break;
      case 'HKQuantityTypeIdentifierStepCount':
        slot.steps = (slot.steps ?? 0) + valueRaw; break;
      case 'HKQuantityTypeIdentifierRespiratoryRate':
        (slot.respiratoryRate ??= []).push(valueRaw); break;
      default:
        unknown++; break;
    }
    byDate.set(dateStr, slot);
  }

  const out: AppleHealthVitalsResult['checkins'] = [];
  for (const [date, b] of byDate.entries()) {
    out.push({
      date, source: 'apple_health',
      bloodOxygenPct: avg(b.bloodOxygenPct),
      pulseBpm: avg(b.pulseBpm),
      bodyTempF: avg(b.bodyTempF),
      systolicMmHg: avg(b.systolicMmHg),
      diastolicMmHg: avg(b.diastolicMmHg),
      // steps live on DailyVitals normally; we still record raw for context
      notes: b.steps !== undefined ? `${Math.round(b.steps).toLocaleString()} steps` : undefined,
    });
  }

  if (out.length === 0) return { data: null, errors: ['No supported HealthKit records found.'], warnings: [] };
  const warnings: string[] = [];
  if (unknown > 0) warnings.push(`${unknown} record(s) of unsupported types were skipped.`);
  return { data: { checkins: out }, errors: [], warnings };
}
