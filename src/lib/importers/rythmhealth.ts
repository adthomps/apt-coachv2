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
