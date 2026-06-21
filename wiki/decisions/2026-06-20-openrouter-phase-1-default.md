# Decision: OpenRouter is the Phase-1 default provider

**Date**: 2026-06-20
**Status**: accepted

## Context

The provider abstraction supports five providers, but the Phase-1 vertical slice needs one
end-to-end path that is reliable for both text (structured JSON) and vision.

## Decision

**OpenRouter is the Phase-1 default.** It is a single code path (the OpenAI-compatible adapter,
shared with OpenAI and Grok), the most permissive for browser use, and supports text + vision +
strict JSON-schema structured output. All other providers ship in Phase 2 but exist in the repo now.

Defaults (editable in Settings, see [providers.ts](../../src/lib/llm/providers.ts)):
- text model `anthropic/claude-sonnet-4.5`, vision model `openai/gpt-4o`.

## Consequences

- The user can still route to any provider; Settings notes photos are sent to the chosen one.
- OpenAI and Grok come "for free" through the same `OpenAICompatibleProvider`; Anthropic and Gemini
  have their own adapters and are validated in Phase 2.
- Strong vision models to recommend: Gemini 2.x, GPT-4o/5 vision, Claude Sonnet/Opus vision; Grok
  vision is weaker (flagged `fair`).
