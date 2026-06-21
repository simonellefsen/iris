# Source: LLM providers

External truth for the five supported providers. Canonical metadata lives in
[src/lib/llm/providers.ts](../../src/lib/llm/providers.ts) (`PROVIDER_LIST`) — this page is the
human-readable summary and the "why". All endpoints are reachable **directly from the browser**
(CORS) with a BYOK key.

| Key | Label | Base URL | Auth | Adapter | Vision |
|-----|-------|----------|------|---------|--------|
| `openrouter` | OpenRouter | `https://openrouter.ai/api/v1` | `Authorization: Bearer` | OpenAICompatible | strong |
| `openai` | OpenAI | `https://api.openai.com/v1` | `Authorization: Bearer` | OpenAICompatible | strong |
| `grok` | xAI Grok | `https://api.x.ai/v1` | `Authorization: Bearer` | OpenAICompatible | fair |
| `anthropic` | Anthropic (Claude) | `https://api.anthropic.com/v1` | `x-api-key` | Anthropic | strong |
| `gemini` | Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | `x-goog-api-key` | Gemini | strong |

## Structured output per provider

`generateStructured()` ([structured.ts](../../src/lib/llm/structured.ts)) shapes one Zod schema
(`zodToJsonSchema`) into each provider's mechanism:

- **OpenAI / Grok / OpenRouter** — `response_format: { type: 'json_schema', json_schema: {...} }`
  (strict), Chat Completions.
- **Anthropic** — a single **tool** whose `input_schema` is the JSON schema; the model is forced to
  call it. Requires headers `anthropic-version: 2023-06-01` **and**
  `anthropic-dangerous-direct-browser-access: true` (the critical browser opt-in).
- **Gemini** — `responseMimeType: application/json` + `responseSchema`.

Output is always Zod-validated; on failure the pipeline retries once with the validation error
appended to the messages.

## Vision / image blocks

Image content is shaped per adapter from the common `ImageBlock { mediaType, base64 }`:
- OpenAI/Grok/OpenRouter: `image_url` with a `data:` URL.
- Anthropic: `image` block, base64 `source`.
- Gemini: `inlineData`.

Payload size matters — always downscale to ≤1568px JPEG (<500 KB) before sending (Anthropic caps
base64 at 5 MB; base64 is +33%). See [media/downscale.ts](../../src/lib/media/downscale.ts).

## Key validation probes

[validate.ts](../../src/lib/llm/validate.ts) — cheap probe → green/red badge in Settings:
OpenAI/OpenRouter/Grok `GET /models`; Anthropic a tiny `POST /v1/messages` with `max_tokens: 1`;
Gemini `GET /models`.

## Default models (editable in Settings)

| Provider | text | vision |
|----------|------|--------|
| OpenRouter | `anthropic/claude-sonnet-4.5` | `openai/gpt-4o` |
| OpenAI | `gpt-4o-mini` | `gpt-4o` |
| Anthropic | `claude-sonnet-4-6` | `claude-sonnet-4-6` |
| Gemini | `gemini-2.0-flash` | `gemini-2.0-flash` |
| Grok | `grok-2-1212` | `grok-2-vision-1212` |

> When updating model ids, change `PROVIDER_LIST` in
> [providers.ts](../../src/lib/llm/providers.ts) and this table together.
