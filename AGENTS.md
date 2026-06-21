# AGENTS.md — Iris

Guidelines for humans and AI agents working on Iris (the PhotoBuddy photography-coach PWA).

## Read first

- **[wiki/index.md](wiki/index.md)** — the LLM-maintained knowledge base. Start there.
- **[wiki/architecture.md](wiki/architecture.md)** — the whole system in Mermaid diagrams.
- **[wiki/decisions/](wiki/decisions/README.md)** — the fixed constraints. **Design within them; do
  not revisit** without a new dated decision.

## Philosophy

- **Local-first, no backend.** Everything runs in the browser; all data is in IndexedDB; the user
  brings their own LLM key (BYOK). There is no server to hold data or keys, and we don't add one.
- **Feasible by construction.** A coach that hands out impossible briefs loses trust instantly.
  Numeric task constraints are clamped to the rig in code (`enforceFeasibility`), never left to the
  LLM alone.
- **Privacy by default.** API keys and photos live on-device. Keys are never logged, never put in a
  URL. Photos are only sent to the provider the user explicitly chose (Settings says so).
- **The wiki is the memory.** Non-trivial changes update the relevant wiki page in the same change.

## Tech stack

- **SvelteKit + TypeScript**, **Svelte 5 runes** for state. Pure client-side SPA (`ssr=false`,
  `prerender=false`), built with `@sveltejs/adapter-vercel`. The adapter is configured inside the
  `sveltekit()` plugin in `vite.config.ts` (there is no `svelte.config.js`).
- **Dexie** (IndexedDB), **exifr** (EXIF/GPS/XMP, HEIC + many RAW), **suncalc** (light phases),
  **zod** (LLM-output validation), **clsx** + minimal CSS, **@vite-pwa/sveltekit** (Workbox).
- **Tests**: vitest + jsdom; mock the network (MSW for provider/weather/geocode).
- **Package manager: pnpm.** Node ≥ 20.

## Project structure (`src/lib/`)

```
types/        domain + provider types (gear, task, submission, evaluation, session, settings)
db/           Dexie schema (IrisDB 'iris') + Blob photo helpers + live (runes) queries
stores/       Svelte 5 $state wrappers over Dexie (settings, session)
llm/          provider.ts (interface) · registry.ts (factory) · providers.ts (metadata)
              openaiCompatible.ts (openrouter/openai/grok) · anthropic.ts · gemini.ts
              structured.ts (per-provider JSON-schema/tool shaping) · validate.ts (key probe)
pipelines/    taskGeneration.ts · evaluation.ts · schemas.ts (zod) · prompts/{taskSystem,evalSystem}
context/      location · sunphase · weather (Open-Meteo) · geocode (BigDataCloud) · places · index
gear/         catalog.{json,ts} · capability.ts (rigCapabilities, enforceFeasibility) · augment.ts
media/        exif.ts · downscale.ts · capture.ts · filepick.ts
utils/        aperture · focal · lensSpec · id · result
routes/       / · /gear · /session · /history · /settings  (+layout: ssr=false)
```

## Coding standards

- **Match the surrounding code** — naming, comment density, idioms. Files are small and focused.
- **`Result<T, E>`** ([utils/result.ts](src/lib/utils/result.ts)) for fallible pipeline functions;
  return `err(message)` with a user-facing string rather than throwing across boundaries.
- **Raw `fetch` for all providers** — no SDKs bundled. Keep auth/headers in the adapter
  (`providers.ts` metadata + the per-provider adapter), not scattered.
- **Zod-validate every LLM output**, retry once with the error appended, then fail with a clear
  message. Never trust model JSON shape.
- **EXIF before canvas.** Always parse EXIF from the raw `File` before any downscale/canvas op
  (canvas strips metadata).
- **Stable string ids** via `uid(prefix)`; `createdAt` epoch-millis.

## Non-negotiables

1. **No backend, no server-held secrets.** Don't add a proxy or a sync server (it's an explicit
   out-of-scope decision).
2. **Keys stay on-device.** IndexedDB only; never localStorage, logs, or URLs. Anthropic needs
   `anthropic-dangerous-direct-browser-access: true`; Gemini uses `x-goog-api-key`.
3. **Feasibility guard runs on every generated task.** Don't bypass `enforceFeasibility`.
4. **Store only downscaled copies + thumbnails**, never originals (iOS quota). Provide export +
   cleanup.
5. **RAW rejected in Phase 1** with a helpful message.

## When adding a feature

1. Write/update the relevant wiki page first (decision / concept / schema).
2. Implement; keep it client-side and provider-agnostic where the LLM is involved.
3. Add/extend a vitest test with the network mocked.
4. Run `pnpm check && pnpm test`.
5. Verify on device when it touches camera/geo/storage/PWA (see
   [wiki/runbooks/manual-qa.md](wiki/runbooks/manual-qa.md)).
6. Append a [wiki/log.md](wiki/log.md) entry for anything non-trivial.

## Build / test / deploy

```bash
pnpm install
pnpm dev            # service worker off in dev
pnpm check          # svelte-check
pnpm test           # vitest
pnpm build && pnpm preview   # PWA active in preview; verify install + offline
```

Full procedure: [wiki/runbooks/build-test-deploy.md](wiki/runbooks/build-test-deploy.md).

## Git guardrails (hooks)

Native git hooks in [`.githooks/`](.githooks) run the same checks as Vercel CI **before code leaves
the machine** — so a failing type-check, test, or build can't be pushed:

- **pre-commit** → `pnpm check` (fast type-check).
- **pre-push** → `pnpm check` + `pnpm test` + `pnpm build`.

They activate automatically on `pnpm install` (the `prepare` script sets
`git config core.hooksPath .githooks`). Bypass only in a genuine emergency with `--no-verify`.

> **Commit the file you import.** The 2026-06-21 CI failure was an *uncommitted* `context/places.ts`
> imported by committed code — it built locally but not on Vercel. After staging, sanity-check with
> `git status` that no imported file is left untracked.
