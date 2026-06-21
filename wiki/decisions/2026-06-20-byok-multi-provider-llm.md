# Decision: BYOK, multi-provider LLM behind one abstraction

**Date**: 2026-06-20
**Status**: accepted (core constraint)

## Context

The coach needs both a text LLM (task generation, structured JSON) and a vision LLM (photo
evaluation). With no backend, the user must supply their own key (BYOK). Different users prefer
different providers, and provider APIs differ in auth and structured-output mechanics.

## Decision

One `LLMProvider` interface, raw `fetch` everywhere (no SDKs bundled), with per-provider adapters:

- **`LLMProvider`** ([provider.ts](../../src/lib/llm/provider.ts)): `generateStructured(req)`,
  `validateKey()`, `supportsVision`. Content blocks support text + image for multimodal eval.
- **Adapters**: `OpenAICompatibleProvider` (OpenRouter, OpenAI, Grok), `AnthropicProvider`,
  `GeminiProvider`. Factory in [registry.ts](../../src/lib/llm/registry.ts) by
  `settings.activeProvider`.
- **Structured output** ([structured.ts](../../src/lib/llm/structured.ts)) is shaped per provider:
  OpenAI/Grok/OpenRouter `response_format: json_schema` (strict); Anthropic a single tool whose
  `input_schema` is the schema; Gemini `responseMimeType: application/json` + `responseSchema`.
  Output is Zod-validated, retried once with the error appended on failure.
- **BYOK**: keys stored in **IndexedDB** (not localStorage), with a one-time on-device warning in
  Settings. Never logged, never in a URL (Gemini uses the `x-goog-api-key` header). Anthropic
  requires `anthropic-dangerous-direct-browser-access: true`.
- **Key validation** ([validate.ts](../../src/lib/llm/validate.ts)): a cheap probe per provider →
  green/red badge in Settings.

## Alternatives considered

- **Single provider** — rejected: lock-in, and users already have a key with *some* provider.
- **Bundle official SDKs** — rejected: bundle bloat + inconsistent browser/CORS behaviour; raw
  `fetch` gives uniform error handling.

## Consequences

- All five endpoints are CORS-capable from the browser (research-cited).
- Settings UI must note that photos are sent to the chosen provider, and surface a per-provider
  "vision quality" hint (Grok vision is weaker → `visionQuality: 'fair'`). See
  [providers.ts](../../src/lib/llm/providers.ts) and
  [sources/llm-providers.md](../sources/llm-providers.md).
- Default provider for Phase 1 is OpenRouter — see
  [that decision](2026-06-20-openrouter-phase-1-default.md).
