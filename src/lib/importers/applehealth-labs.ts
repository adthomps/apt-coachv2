/**
 * Apple Health labs importer.
 * Accepts:
 *  - FHIR R4 Observation bundles (lab results exported from Apple Health Records)
 *  - Generic JSON arrays of { marker, value, unit, referenceRange?, time? }
 *  - PDF text (pre-extracted) using a generic "Marker  Value  Unit  Range" regex
 *
 * Produces a `BloodPanel`-compatible payload with `source: 'apple_health'`.
 */

import type { BloodMarker, BloodMarkerStatus, BloodPanel } from '@/lib/api/types';
import type { ImporterResult } from './index';

export interface AppleHealthLabsResult {
  panelInput: Omit<BloodPanel, 'id' | 'createdAt'>;
  outOfRangeCount: number;
}

interface RawMarker {
  marker: string;
  value: number;
  unit: string;
  referenceRange?: string;
  time?: string;
}

function parseRange(range?: string): { min: number; max: number; text: string } {
  if (!range) return { min: 0, max: 0, text: '' };
  const cleaned = range.replace(/[<>=]/g, '').trim();
  const m = cleaned.match(/(-?\d+\.?\d*)\s*[-–to]+\s*(-?\d+\.?\d*)/i);
  if (m) return { min: parseFloat(m[1]), max: parseFloat(m[2]), text: range };
  return { min: 0, max: 0, text: range };
}

function statusFor(value: number, min: number, max: number): BloodMarkerStatus {
  if (max <= 0) return 'average';
  if (value < min || value > max) return 'outOfRange';
  // Loose "optimal" heuristic: middle 60% of the range
  const span = max - min;
  if (value >= min + span * 0.2 && value <= min + span * 0.8) return 'optimal';
  return 'average';
}

function toBloodMarker(r: RawMarker, fallbackDate: string): BloodMarker {
  const range = parseRange(r.referenceRange);
  return {
    marker: r.marker.trim(),
    value: r.value,
    unit: (r.unit || '').trim(),
    referenceRange: range.text,
    referenceMin: range.min,
    referenceMax: range.max,
    status: statusFor(r.value, range.min, range.max),
    time: (r.time || fallbackDate).slice(0, 10),
  };
}

// ---- FHIR ----

interface FhirObservation {
  resourceType?: string;
  code?: { text?: string; coding?: { display?: string; code?: string }[] };
  valueQuantity?: { value?: number; unit?: string };
  effectiveDateTime?: string;
  issued?: string;
  referenceRange?: { low?: { value?: number; unit?: string }; high?: { value?: number; unit?: string }; text?: string }[];
}

function fromFhir(parsed: unknown): RawMarker[] {
  const out: RawMarker[] = [];
  const obs: FhirObservation[] = [];
  // Bundle?
  if (parsed && typeof parsed === 'object' && 'entry' in parsed && Array.isArray((parsed as { entry: unknown[] }).entry)) {
    for (const e of (parsed as { entry: { resource?: FhirObservation }[] }).entry) {
      if (e.resource?.resourceType === 'Observation') obs.push(e.resource);
    }
  } else if (Array.isArray(parsed)) {
    for (const o of parsed as FhirObservation[]) {
      if (o.resourceType === 'Observation') obs.push(o);
    }
  }
  for (const o of obs) {
    const value = o.valueQuantity?.value;
    if (value === undefined) continue;
    const marker = o.code?.text || o.code?.coding?.[0]?.display || o.code?.coding?.[0]?.code;
    if (!marker) continue;
    const r = o.referenceRange?.[0];
    const refText = r?.text
      || (r?.low?.value !== undefined && r?.high?.value !== undefined ? `${r.low.value} - ${r.high.value}` : undefined);
    out.push({
      marker,
      value,
      unit: o.valueQuantity?.unit || r?.high?.unit || '',
      referenceRange: refText,
      time: (o.effectiveDateTime || o.issued || '').slice(0, 10) || undefined,
    });
  }
  return out;
}

// ---- Generic JSON array ----

function fromGenericArray(parsed: unknown): RawMarker[] {
  if (!Array.isArray(parsed)) return [];
  const out: RawMarker[] = [];
  for (const row of parsed as Record<string, unknown>[]) {
    const marker = String(row.marker ?? row.name ?? '').trim();
    const value = Number(row.value);
    if (!marker || Number.isNaN(value)) continue;
    out.push({
      marker,
      value,
      unit: String(row.unit ?? ''),
      referenceRange: row.referenceRange ? String(row.referenceRange) : (row.reference_range ? String(row.reference_range) : undefined),
      time: row.time ? String(row.time) : (row.date ? String(row.date) : undefined),
    });
  }
  return out;
}

export function parseAppleHealthLabsJson(jsonText: string): ImporterResult<AppleHealthLabsResult> {
  if (!jsonText.trim()) return { data: null, errors: ['No data provided.'], warnings: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { data: null, errors: ['Invalid JSON.'], warnings: [] };
  }
  let raw = fromFhir(parsed);
  if (raw.length === 0) raw = fromGenericArray(parsed);
  if (raw.length === 0) {
    return { data: null, errors: ['No lab observations found. Expected FHIR Observation bundle or array of { marker, value, unit, referenceRange?, time? }.'], warnings: [] };
  }
  const fallbackDate = raw.find(r => r.time)?.time?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const markers = raw.map(r => toBloodMarker(r, fallbackDate));
  const outOfRangeCount = markers.filter(m => m.status === 'outOfRange').length;
  return {
    data: {
      panelInput: {
        source: 'apple_health',
        panelDate: fallbackDate,
        markers,
        rawJson: jsonText,
      },
      outOfRangeCount,
    },
    errors: [],
    warnings: [],
  };
}

// ---- PDF text → markers ----
// Matches lines like:  "ApoB  131  mg/dL  0 - 90"
// or                     "Free T3 4.25 pg/mL 2 - 4.4"
const PDF_LINE = /^([A-Za-z][A-Za-z0-9 .,/()\-+%]+?)\s+(-?\d+\.?\d*)\s+([A-Za-z%/µ°]+(?:\/[A-Za-z]+)?)\s+(\d+\.?\d*\s*[-–to]+\s*\d+\.?\d*)/;

export function parseAppleHealthLabsPdfText(text: string, fallbackDate?: string): ImporterResult<AppleHealthLabsResult> {
  if (!text.trim()) return { data: null, errors: ['No PDF text provided.'], warnings: [] };
  const date = fallbackDate || new Date().toISOString().slice(0, 10);
  const warnings: string[] = [];
  const markers: BloodMarker[] = [];
  const lines = text.split(/\r?\n/);
  let unparsed = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 6) continue;
    // Skip likely headers/footers
    if (/^(page|patient|date|provider|name|dob|specimen|result|range|units?)\b/i.test(trimmed)) continue;
    const m = trimmed.match(PDF_LINE);
    if (!m) {
      // Only warn for lines that include a number — likely a missed lab row
      if (/\d/.test(trimmed) && trimmed.length < 120) unparsed++;
      continue;
    }
    const [, marker, valueStr, unit, range] = m;
    const value = parseFloat(valueStr);
    if (Number.isNaN(value)) continue;
    markers.push(toBloodMarker({ marker, value, unit, referenceRange: range, time: date }, date));
  }
  if (markers.length === 0) {
    return { data: null, errors: ['Could not extract any labs from the PDF text. Try the JSON path with FHIR data instead.'], warnings: [] };
  }
  if (unparsed > 0) warnings.push(`${unparsed} numeric line(s) could not be parsed and were skipped.`);
  const outOfRangeCount = markers.filter(m => m.status === 'outOfRange').length;
  return {
    data: {
      panelInput: {
        source: 'apple_health',
        panelDate: date,
        markers,
        rawPdfText: text,
      },
      outOfRangeCount,
    },
    errors: [],
    warnings,
  };
}

/**
 * Extract text from a PDF File using pdfjs (lazy-loaded).
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Use bundled worker via Vite's ?url import pattern
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lineMap = new Map<number, string[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      const y = Math.round(item.transform[5]);
      const arr = lineMap.get(y) ?? [];
      arr.push(item.str);
      lineMap.set(y, arr);
    }
    const ys = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      out += lineMap.get(y)!.join(' ') + '\n';
    }
    out += '\n';
  }
  return out;
}
