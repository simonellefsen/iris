# Concept: local-first PWA

Iris is **local-first** and **backend-less**. Everything the user owns — settings, gear, tasks,
photos, evaluations, history — lives on their device in IndexedDB. The only network calls are to
public context APIs and to the LLM provider the user configured with their own key.

## Why

- **Privacy + cost.** No server means no place to leak keys or photos, and nothing to operate or
  pay for. The user's API key is their billing relationship, not ours (BYOK).
- **Offline resilience.** The app shell is precached; history and gear render offline. Only the
  live coaching flow (which inherently needs the network) degrades — and it does so gracefully.
- **Simplicity.** No auth, no sync server, no migrations-on-a-database-you-operate.

## Consequences (the things you must respect)

- **Secure context required.** Geolocation, camera, and the service worker only work over HTTPS
  (localhost counts as secure for dev). Trigger permission prompts from a user tap.
- **Storage is the user's, and it can be evicted.** See the iOS quota notes in
  [schema.md](../schema.md#ios--quota-notes). Keep only downscaled copies; provide export + cleanup.
- **No cross-device sync** (would need a backend — out of scope). The data model is kept
  sync-friendly anyway: plain JSON, stable ids.
- **Keys live in IndexedDB**, with a one-time on-device warning in Settings. Never logged, never in
  a URL.
- **EXIF before canvas.** Any canvas operation strips metadata, so EXIF must be parsed from the raw
  `File` first (see [architecture.md](../architecture.md#3-evaluation-loop-submit-a-photo)).

## PWA mechanics

- `@vite-pwa/sveltekit` (Workbox, `generateSW`, `autoUpdate`) produces the manifest + service
  worker. Manifest: name `Iris`, `display: standalone`, scope `/`. See [vite.config.ts](../../vite.config.ts).
- Runtime caching: Open-Meteo `NetworkFirst` (30 min), BigDataCloud `StaleWhileRevalidate` (30 days).
- The SW is disabled in `pnpm dev` (`devOptions.enabled: false`) to keep dev fast; verify the full
  offline/installable behaviour in `build`/`preview`.
- iOS: needs `apple-mobile-web-app-capable` meta + an "Add to Home Screen" hint (no JS install API
  on iOS). An installed iOS PWA has its **own storage partition** separate from Safari.

See [decisions/2026-06-20-client-side-pwa-no-backend.md](../decisions/2026-06-20-client-side-pwa-no-backend.md).
