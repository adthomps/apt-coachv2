/**
 * APT Importers — shared parsing/validation for all data sources.
 * Each importer takes raw text input and returns a typed result with errors.
 * UI layer (Admin) renders the result; storage layer (api/client) commits it.
 */

export interface ImporterResult<T> {
  data: T | null;
  errors: string[];
  warnings: string[];
}

export type { BodyspecResult } from './bodyspec';
export type { RythmHealthResult } from './rythmhealth';
export type { AppleHealthLabsResult } from './applehealth-labs';
export type { WithingsScaleResult } from './withings-scale';
export type { WithingsBpmResult } from './withings-bpm';
export type { WithingsBeamoResult } from './withings-beamo';
export type { SkulptResult } from './skulpt-chisel';
export type { LumenResult } from './lumen';
export type { AppleHealthVitalsResult } from './applehealth-vitals';
export { parseBodyspecJson } from './bodyspec';
export { parseRythmHealthCsv, parseRythmHealthJson } from './rythmhealth';
export { parseAppleHealthLabsJson, parseAppleHealthLabsPdfText, extractPdfText } from './applehealth-labs';
export { parseWithingsScaleCsv } from './withings-scale';
export { parseWithingsBpmCsv } from './withings-bpm';
export { parseWithingsBeamoJson } from './withings-beamo';
export { parseSkulptJson } from './skulpt-chisel';
export { parseLumenJson } from './lumen';
export { parseAppleHealthVitalsJson } from './applehealth-vitals';
export { parseEntityArrayJson } from './generic';
