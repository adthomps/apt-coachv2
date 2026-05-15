/**
 * APT Layer: data
 * ---------------
 * Re-exports the transport + contracts layer.
 *
 * Boundary rule: only `services/` and `hooks/` may import from `@/data`.
 * `pages/` and `components/` MUST NOT import from `@/data` directly.
 *
 * The mock client is active today (USE_MOCK_API=true). On Cloudflare cutover,
 * flip the switch in `http-client.ts` and the realClient takes over without
 * changing any other file.
 */
export * from '@/lib/api';
export * as types from '@/lib/api/types';
export { isMockMode } from '@/lib/api/http-client';
