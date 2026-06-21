# Runbook: build, test, deploy

Package manager is **pnpm** (`engines.node >= 20`; the Vercel adapter targets `nodejs22.x`).

## Local development

```bash
pnpm install
pnpm dev            # vite dev — fast; service worker is DISABLED in dev
pnpm dev -- --open
```

Dev runs over `http://localhost`, which counts as a secure context, so geolocation/camera work.
The service worker is intentionally off in dev (`devOptions.enabled: false` in
[vite.config.ts](../../vite.config.ts)) — verify offline/installable behaviour in a real build.

First-run setup in the app: open **Settings**, paste a provider API key (default provider
OpenRouter), confirm the green key-validation badge, pick a skill level. Then **Gear** to pick a rig.

## Type-check & tests

```bash
pnpm check          # svelte-kit sync + svelte-check (TS + Svelte)
pnpm test           # vitest run (jsdom)
```

Test suites of note: `pipelines` (task gen with mocked provider → Zod-valid + feasibility),
`llm/structured.test.ts` (per-provider request shaping), `llm/providers.test.ts`,
`gear/capability.test.ts` (variable-aperture zoom, crop-factor), `utils/lensSpec.test.ts`,
`context/places.test.ts`. Network is mocked (the brief calls for MSW for provider/weather).

## Git guardrails (pre-commit / pre-push hooks)

Native git hooks in [`.githooks/`](../../.githooks) enforce the CI checks locally so a broken commit
can't reach GitHub/Vercel:

- **pre-commit** runs `pnpm check` (type-check) for fast feedback.
- **pre-push** runs `pnpm check` + `pnpm test` + `pnpm build` (the full Vercel-equivalent gate).

They activate automatically: the `prepare` script (run on `pnpm install`) sets
`git config core.hooksPath .githooks`. To set it manually:

```bash
git config core.hooksPath .githooks
```

Emergency bypass: `git commit --no-verify` / `git push --no-verify` (use sparingly).

> **Gotcha that bit us (2026-06-21):** the build failed on Vercel with `UNRESOLVED_IMPORT` for
> `./places` because `context/places.ts` was imported by committed code but itself **left
> untracked**. It compiled locally (the file was on disk) but not from a fresh clone. After
> `git add`, confirm with `git status` that no imported file is still untracked.

## Production build + PWA verify

```bash
pnpm build          # vite build via @sveltejs/adapter-vercel (SPA: ssr=false fallback)
pnpm preview        # serve the build; service worker is ACTIVE here
```

In `preview`, verify: the app installs (manifest `Iris`, standalone), the shell loads offline, and
Open-Meteo/BigDataCloud responses are runtime-cached. On iOS, confirm the "Add to Home Screen" hint
and that the installed PWA has its own storage (separate from Safari).

## Deploy (Vercel)

The build output is static (client-only SPA). Deploy the repo to Vercel (the `@sveltejs/adapter-vercel`
build is detected automatically; `.vercel/` holds local build output). **HTTPS is mandatory in prod**
for geolocation, camera, and the service worker.

> No secrets are committed. There is no server-side key — every LLM key is the user's, entered in
> the app and stored in their browser's IndexedDB.
