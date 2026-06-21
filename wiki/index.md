# Iris Wiki

**LLM-optimized project knowledge base.** This directory (and its subdirs) is the primary
context source for agents working on Iris (the PhotoBuddy photography-coach PWA). Start here,
then follow links.

For full context, also read:
- [../README.md](../README.md) — product/repo overview
- [../AGENTS.md](../AGENTS.md) — conventions for humans + coding agents

## What Iris is

A **photography coach that runs in the browser** (iOS Safari, Android Chrome, desktop). It reads
your location, the time-of-day light, and the weather, then asks an LLM to design a photography
**task** tailored to your gear and the current conditions. You shoot, submit the photo, and a
**vision LLM** grades it against the brief (composition, exposure, constraint adherence,
creativity) with a rubric score.

It is a **pure client-side PWA** — SvelteKit + TypeScript, no backend. All data lives in the
browser (IndexedDB via Dexie). The user brings their own LLM key (BYOK).

> **Product name note:** the app ships as **Iris** (package, Dexie DB, and PWA manifest all say
> `iris`). "PhotoBuddy" is the working title from the original design brief. Treat them as the
> same project.

## Structure

- **architecture.md** — System topology, the task-generation loop, the evaluation loop, the LLM
  provider abstraction, and the data model, all as Mermaid diagrams. **Start here for the big picture.**
- **schema.md** — IndexedDB (Dexie) schema, the domain data models, and invariants.
- **concepts/** — Core ideas and mental models (coaching loop, local-first PWA, gear capability
  model, the LLM-maintained wiki itself).
- **decisions/** — Architectural/tech decisions with rationale (the "design within these, do not
  revisit" constraints from the brief, written down).
- **experiments/** — Ideas under test, prompt-tuning notes, model comparisons.
- **runbooks/** — Operational procedures (build/test/deploy, manual QA on device).
- **sources/** — External references: LLM provider APIs, context APIs (weather/geocode), gear data.
- **log.md** — Chronological living log of major progress, decisions, and learnings.

## Quick navigation for agents

0. **See the whole system fast**: [architecture.md](architecture.md) (Mermaid diagrams).
1. **Understand the "why" and the fixed constraints**: [decisions/](decisions/README.md).
2. **Data & persistence**: [schema.md](schema.md).
3. **How to change things safely**: [../AGENTS.md](../AGENTS.md).
4. **External truth (APIs)**: [sources/llm-providers.md](sources/llm-providers.md),
   [sources/context-apis.md](sources/context-apis.md).
5. **Current state & plan**: this index + recent [log.md](log.md) entries.

## Current status (summary)

**Phase**: transitioning out of **Phase 1** (end-to-end vertical slice) into **Phase 2** (gear
richness + multi-provider). The repo already contains scaffolding for all five providers, the
context gatherers, both pipelines, the Dexie schema, and the gear capability engine.

**Default provider**: OpenRouter (single code path; OpenAI/Grok share the same OpenAI-compatible
adapter, Anthropic and Gemini have their own).

**Deployment**: static SPA (`ssr=false`) built with `@sveltejs/adapter-vercel` and shipped as a
Workbox-powered installable PWA.

See [log.md](log.md) for the latest entries and active tasks.

## Maintenance

This wiki is **LLM-maintained with human oversight**. Treat it as the project's memory: update the
relevant page (especially `decisions/`, `log.md`, `schema.md`) as part of any non-trivial change.
See [concepts/llm-maintained-project-wiki.md](concepts/llm-maintained-project-wiki.md).
