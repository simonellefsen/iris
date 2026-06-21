# Decision: pure client-side PWA, no backend

**Date**: 2026-06-20
**Status**: accepted (core constraint)

## Context

Iris must run in mobile browsers (iOS Safari, Android Chrome) and on desktop, and use the user's
own LLM key. The product is a personal coach over personal photos — privacy-sensitive, and with no
inherent need for shared server state.

## Decision

Build a **pure client-side PWA** with **no backend**:

- SvelteKit + TypeScript, Svelte 5 runes for state.
- Static build via `@sveltejs/adapter-vercel` (pinned `nodejs22.x` runtime), `ssr=false`,
  `prerender=false` → a fallback `index.html` SPA. (The original brief named `adapter-static`; the
  Vercel adapter in SPA mode produces the equivalent static output and is what the repo uses.)
- All persistent data in **IndexedDB via Dexie** (DB name `iris`).
- `@vite-pwa/sveltekit` (Workbox) for the manifest + service worker (precache shell, runtime-cache
  weather/geocode).
- Local-first, offline-capable, BYOK.

## Alternatives considered

- **Thin backend for key proxying / sync** — rejected: adds an operated service, a place to leak
  keys/photos, auth, and cost, for no feature the product needs in scope. Cross-device sync is
  explicitly out of scope.
- **Native app** — rejected: the web reach (one build, instant, installable) is the point, and the
  camera-ingest story is the same either way (see
  [camera-ingest decision](2026-06-20-camera-ingest-via-exif.md)).

## Consequences

- HTTPS required in prod for geolocation/camera/SW (localhost is a secure context for dev).
- Storage is the user's and can be evicted (esp. iOS) — keep downscaled copies only, provide export
  + cleanup. See [schema.md](../schema.md#ios--quota-notes).
- No sync, but the data model stays sync-friendly (plain JSON, stable ids) in case that changes.
- See [concepts/local-first-pwa.md](../concepts/local-first-pwa.md).
