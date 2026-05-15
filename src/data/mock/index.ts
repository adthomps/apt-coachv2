/**
 * APT Layer: data/mock
 * --------------------
 * Re-exports the active mock client + fixtures. This is the demo's source
 * of truth until the Cloudflare cutover (ADR 0002).
 */
export * from '@/lib/api/client';
export * from '@/lib/api/mock-data';
