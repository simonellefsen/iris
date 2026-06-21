# Concept: the LLM-maintained project wiki

This `wiki/` directory is the project's **durable memory**, written primarily for LLM agents (and
secondarily for humans). It exists because the most expensive part of any agent session is
re-deriving context that was already worked out before. A good wiki turns that into a cheap read.

## Principles

1. **One source of truth per fact.** A decision, a schema, an invariant lives in exactly one page.
   Other pages link to it rather than restating it (links go stale slower than copies).
2. **Write the "why", not just the "what".** Code already says what it does. The wiki captures the
   constraints, trade-offs, and dead-ends that the code can't tell you.
3. **LLM-optimized formatting.** Short sections, explicit cross-links, Mermaid diagrams for
   structure, tables for enumerations. Assume the reader is an agent that will follow links.
4. **Update as part of the change, not after.** A non-trivial code change that doesn't touch the
   wiki is incomplete. Especially: `decisions/`, `schema.md`, `log.md`.
5. **Date things.** Decisions and log entries carry absolute dates so future readers know how stale
   a claim is.

## What goes where

- **decisions/** — a choice with alternatives and rationale (the kind of thing you'd otherwise
  re-litigate). The brief's "design within these, do not revisit" items are decisions.
- **concepts/** — durable mental models (this page, the coaching loop, the gear capability model).
- **schema.md** — the data contract.
- **architecture.md** — how the pieces fit, in diagrams.
- **runbooks/** — repeatable operational procedures.
- **sources/** — external truth (API shapes, version pins) so we don't guess from memory.
- **experiments/** — things under test that haven't earned a decision yet.
- **log.md** — the chronological narrative; the only append-heavy file.

## Maintenance discipline

When you finish a unit of work, ask: *what did we learn, and where should it live?* Then write it
there before moving on. If a page contradicts the code, the code wins — fix the page in the same
breath.
