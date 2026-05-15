# AI Prompts — Versioned

Per APT `ai-agent-framework.md`, every prompt the system sends to an LLM must
be:

- **Named** (filename = stable identifier).
- **Versioned** (`*.v1.md`, `*.v2.md`; never silently mutated).
- **Owned** (frontmatter `owner` field).
- **Auditable** (lives in source control, reviewed in PRs).

The current insight engines (`src/lib/ai/insights.ts`) are deterministic and
do not call an LLM yet. The prompts here are the contracts that LLM-backed
versions will honor when they replace those engines.

When promoting an engine to LLM-backed:

1. Add a new ADR under `docs/apt/decisions/`.
2. Bump the prompt version (`*.v2.md`) for any breaking input/output change.
3. Keep the previous version file for replay/debug.
