/**
 * RythmHealth blood panel CSV importer.
 * CSV format: marker,value,unit,reference_range,status,time
 */

import type { BloodMarker, BloodMarkerStatus, BloodPanel } from '@/lib/api/types';
import type { ImporterResult } from './index';

export interface RythmHealthResult {
  panelInput: Omit<BloodPanel, 'id' | 'createdAt'>;
  outOfRangeCount: number;
}

function parseReferenceRange(range: string): { min: number; max: number } {
  const parts = range.split('-').map((s) => s.trim());
  return { min: parseFloat(parts[0]) || 0, max: parseFloat(parts[1]) || 0 };
}

export function parseRythmHealthCsv(csvText: string): ImporterResult<RythmHealthResult> {
  if (!csvText.trim()) {
    return { data: null, errors: ['No data provided.'], warnings: [] };
  }

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { data: null, errors: ['CSV must have a header row and at least one data row.'], warnings: [] };
  }

  const header = lines[0].toLowerCase();
  if (!header.includes('marker') || !header.includes('value')) {
    return {
      data: null,
      errors: ['CSV header must contain: marker, value, unit, reference_range, status, time'],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const markers: BloodMarker[] = [];
  const validStatuses: BloodMarkerStatus[] = ['optimal', 'average', 'outOfRange'];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map((s) => s.trim());
    if (parts.length < 5) {
      errors.push(`Row ${i + 1}: expected at least 5 columns, got ${parts.length}.`);
      continue;
    }

    const [marker, valueStr, unit, refRange, status, time] = parts;
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      errors.push(`Row ${i + 1}: invalid value "${valueStr}" for ${marker}.`);
      continue;
    }

    const parsedStatus: BloodMarkerStatus = validStatuses.includes(status as BloodMarkerStatus)
      ? (status as BloodMarkerStatus)
      : 'average';
    const { min, max } = parseReferenceRange(refRange);

    markers.push({
      marker,
      value,
      unit,
      referenceRange: refRange,
      referenceMin: min,
      referenceMax: max,
      status: parsedStatus,
      time: time || new Date().toISOString().split('T')[0],
    });
  }

  if (errors.length > 0 && markers.length === 0) {
    return { data: null, errors, warnings: [] };
  }

  const panelDate = markers[0]?.time || new Date().toISOString().split('T')[0];
  const outOfRangeCount = markers.filter((m) => m.status === 'outOfRange').length;

  return {
    data: {
      panelInput: {
        source: 'rythmhealth',
        panelDate,
        markers,
        rawCsv: csvText,
      },
      outOfRangeCount,
    },
    errors,
    warnings: [],
  };
}

/**
 * Rythm Health JSON importer.
 * Accepts either:
 *   - { panelDate?: string, markers: BloodMarker[] }
 *   - BloodMarker[]
 * Each marker may use referenceRange string OR explicit referenceMin/referenceMax.
 */
export function parseRythmHealthJson(jsonText: string): ImporterResult<RythmHealthResult> {
  if (!jsonText.trim()) {
    return { data: null, errors: ['No data provided.'], warnings: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return { data: null, errors: [`Invalid JSON: ${(e as Error).message}`], warnings: [] };
  }

  const root = Array.isArray(parsed)
    ? { markers: parsed as Record<string, unknown>[] }
    : (parsed as { panelDate?: string; markers?: Record<string, unknown>[] });

  const rawMarkers = Array.isArray(root.markers) ? root.markers : [];
  if (rawMarkers.length === 0) {
    return { data: null, errors: ['No markers found in JSON.'], warnings: [] };
  }

  const validStatuses: BloodMarkerStatus[] = ['optimal', 'average', 'outOfRange'];
  const errors: string[] = [];
  const warnings: string[] = [];
  const markers: BloodMarker[] = [];

  rawMarkers.forEach((m, i) => {
    const name = String(m.marker ?? m.name ?? '').trim();
    const value = Number(m.value);
    if (!name) { errors.push(`Marker ${i + 1}: missing marker name.`); return; }
    if (!Number.isFinite(value)) { errors.push(`Marker ${name}: invalid value.`); return; }

    const refRangeStr = String(m.referenceRange ?? m.reference_range ?? '');
    let { min, max } = parseReferenceRange(refRangeStr);
    if (m.referenceMin != null) min = Number(m.referenceMin);
    if (m.referenceMax != null) max = Number(m.referenceMax);

    const statusRaw = String(m.status ?? '');
    const status: BloodMarkerStatus = validStatuses.includes(statusRaw as BloodMarkerStatus)
      ? (statusRaw as BloodMarkerStatus)
      : 'average';

    markers.push({
      marker: name,
      value,
      unit: String(m.unit ?? ''),
      referenceRange: refRangeStr || `${min}-${max}`,
      referenceMin: min,
      referenceMax: max,
      status,
      time: String(m.time ?? root.panelDate ?? new Date().toISOString().split('T')[0]),
    });
  });

  if (markers.length === 0) {
    return { data: null, errors: errors.length ? errors : ['No valid markers parsed.'], warnings };
  }

  const panelDate = root.panelDate || markers[0].time;
  const outOfRangeCount = markers.filter(m => m.status === 'outOfRange').length;

  return {
    data: {
      panelInput: {
        source: 'rythmhealth',
        panelDate,
        markers,
        rawCsv: jsonText,
      },
      outOfRangeCount,
    },
    errors,
    warnings,
  };
}
