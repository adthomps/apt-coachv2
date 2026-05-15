# APT Adoption Status

| APT Layer | Status | Notes |
|---|---|---|
| Thinking (decision records) | Adopted | See `decisions/`. New medium/high-risk changes require an ADR. |
| Design tokens | Adopted | HSL tokens in `src/index.css`; mirror in `references/design-tokens.json`. |
| Hybrid header / footer template | Adopted | `src/components/layout/Layout.tsx`. Sticky, blurred, accent active state. |
| Responsibility map | Partial | See `responsibility-matrix.md`. Phase A reorg in flight. |
| Boundary enforcement (ESLint) | Adopted | `import/no-restricted-paths` rules in `.eslintrc.cjs`. |
| Mock-first frontend | Adopted | `USE_MOCK_API` switch in `src/data/index.ts`. |
| Cloudflare-oriented baseline | Deferred | Target Pages + Workers + D1. See ADR 0002. |
| AI prompt ownership | Adopted | Versioned prompts in `src/domain/ai/prompts/`. |
| RLS / roles table | Deferred | No backend yet. See ADR 0004. |
| CI/CD pipeline | Deferred | Lovable preview is the current pipeline. |
| Branch protection / CODEOWNERS | Deferred | Single-owner project today. |

## Out of Scope (Today)

- Monorepo extraction (`apps/` + `packages/`). Folder shape inside `src/` mirrors the eventual layout so the future `git mv` is mechanical.
- Real backend cutover. `src/data/real/client.ts` is a dormant shell.
