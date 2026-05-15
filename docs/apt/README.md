# APT Doctrine — Project Adoption Layer

This directory records how **APT Fitness Coach** applies the canonical doctrine
published at https://github.com/adthomps/apt-principles.

Canonical sources (read these first):

- `thinking.md` — How decisions get made.
- `design.md` — Visual + interaction standards.
- `architecture.md` — Boundaries, responsibility map, Cloudflare baseline.
- `system-standards.md` — CI, change containment, required artifacts.
- `security.md` — Trust boundaries, RLS, secrets.
- `ai-agent-framework.md` — Prompt ownership, audit, versioning.

Local files in this folder describe **only the deltas, decisions, and adoptions
specific to this project**. They do not restate canonical doctrine.

## Map

| File | Purpose |
|---|---|
| `adoption.md` | Which APT layers we have adopted, partially adopted, or deferred. |
| `responsibility-matrix.md` | APT responsibility map filled in for our folders. |
| `boundary-map.md` | Forbidden import directions; enforced in ESLint. |
| `state-map.md` | Required UI states per major feature. |
| `decisions/` | Architecture Decision Records (ADRs). |
| `../../references/architecture-map.json` | Machine-readable boundary map. |
| `../../references/design-tokens.json` | Portable design-token contract. |
