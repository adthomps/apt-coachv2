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
export { parseBodyspecJson } from './bodyspec';
export { parseRythmHealthCsv } from './rythmhealth';
export { parseAppleHealthLabsJson, parseAppleHealthLabsPdfText, extractPdfText } from './applehealth-labs';
export { parseEntityArrayJson } from './generic';
