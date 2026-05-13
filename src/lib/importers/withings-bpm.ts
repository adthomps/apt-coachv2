/**
 * Withings BPM (Vision/Core) blood pressure CSV importer.
 * Columns: Date,Systolic (mmHg),Diastolic (mmHg),Heart rate (bpm)
 */

import type { HealthCheckin } from '@/lib/api/types';
import type { ImporterResult } from './index';

export interface WithingsBpmResult {
  checkins: Array<Omit<HealthCheckin, 'id' | 'createdAt' | 'tier'>>;
}

function find(header: string[], ...candidates: string[]) {
  for (let i = 0; i < header.length; i++) {
    const h = header[i].toLowerCase();
    if (candidates.some(c => h.includes(c))) return i;
  }
  return -1;
}

export function parseWithingsBpmCsv(csvText: string): ImporterResult<WithingsBpmResult> {
  if (!csvText.trim()) return { data: null, errors: ['No data provided.'], warnings: [] };
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { data: null, errors: ['Need a header row + at least one reading.'], warnings: [] };

  const header = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  const ix = {
    date: find(header, 'date'),
    sys: find(header, 'systolic'),
    dia: find(header, 'diastolic'),
    hr: find(header, 'heart', 'pulse'),
  };
  if (ix.date < 0 || ix.sys < 0 || ix.dia < 0) {
    return { data: null, errors: ['CSV must include Date, Systolic, Diastolic columns.'], warnings: [] };
  }

  const checkins: WithingsBpmResult['checkins'] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const date = (parts[ix.date] || '').slice(0, 10);
    const sys = parseFloat(parts[ix.sys]);
    const dia = parseFloat(parts[ix.dia]);
    if (!date || Number.isNaN(sys) || Number.isNaN(dia)) continue;
    const hr = ix.hr >= 0 ? parseFloat(parts[ix.hr]) : NaN;
    checkins.push({
      date, source: 'withings_bpm',
      systolicMmHg: Math.round(sys),
      diastolicMmHg: Math.round(dia),
      pulseBpm: Number.isFinite(hr) ? Math.round(hr) : undefined,
    });
  }
  if (checkins.length === 0) return { data: null, errors: ['No valid BP rows found.'], warnings: [] };
  return { data: { checkins }, errors: [], warnings: [] };
}
