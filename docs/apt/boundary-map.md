# Boundary Map

Visual summary of allowed import directions. Arrows point **from caller to callee**.

```text
            ┌─────────────────────────────────────────┐
            │                pages/                   │
            └─────────────┬───────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────────────────────┐
            │  features/   (vertical slices)          │
            └────┬───────────────────┬────────────────┘
                 │                   │
                 ▼                   ▼
      ┌──────────────────┐   ┌─────────────────────┐
      │  hooks/services  │──▶│       data/        │
      └──────┬───────────┘   │  (mock | real)     │
             │               └─────────────────────┘
             ▼
      ┌──────────────────┐
      │     domain/      │  ◀─── pure, no React, no data/
      └──────────────────┘
             ▲
             │
      ┌──────┴───────────┐
      │  components/, ui │   (presentational only)
      └──────────────────┘
```

Rules enforced by ESLint `import/no-restricted-paths` — see `.eslintrc.cjs`.
