# ADR 0003 — Blue Primary, Teal Accent

- **Status:** Accepted
- **Date:** 2026-05
- **Risk:** Low

## Context

APT design doctrine requires semantic color tokens with a clear primary,
accent, and feedback palette in HSL.

## Decision

- `--primary` blue `217 91% 60%` — actions, links, brand surfaces.
- `--accent` teal `173 80% 40%` — selection, active tab/pill state.
- `--success` `142 76% 36%`, `--warning` `38 92% 50%`, `--destructive` `0 84% 60%`
  — value-compare chips and status indicators.

Active state convention (documented in `src/index.css`):

- Tab/pill active → `bg-accent/15 text-accent border-accent/30`.
- Primary CTA → `bg-primary text-primary-foreground hover:bg-primary-hover`.
- Inline link → `text-primary underline-offset-4 hover:underline`.

## Consequences

- No raw Tailwind colors (`bg-blue-500`, etc.) in components — caught in PR review.
- Future light-mode pass tunes the same token names; no component edits needed.
