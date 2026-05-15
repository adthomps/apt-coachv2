/**
 * APT Layer: domain
 * -----------------
 * Pure business logic — must remain framework-free so it can be promoted
 * verbatim to `packages/domain` and run inside a Cloudflare Worker.
 *
 * Boundary rules (enforced via ESLint):
 *   - No imports from `react`, `react-router-dom`, `@/hooks`, `@/components`.
 *   - No imports from `@/data` except `@/data/types` (the contract).
 */
export * from '@/lib/protocol';
export * from '@/lib/blood-marker-engine';
export * from '@/lib/adaptive-engine';
export * from '@/lib/nutrition-targets';
export * from '@/lib/schedule-sync';
export * as healthSelectors from '@/lib/selectors/health';
export * as insights from '@/lib/ai/insights';
