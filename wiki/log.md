# Log

Chronological living log of major progress, decisions, and learnings for Iris. Newest entries at
the top. Use absolute dates.

---

## 2026-06-21 — Session UX: selectable Nearby, map links, badge fix

- **Badge rework.** Technique tags + difficulty were in a non-wrapping flex `.row`, so flexbox
  shrank each pill below its content width and labels wrapped vertically ("BE GIN NE R"). Added a
  wrapping `.chips`/`.chip` system (`white-space: nowrap`, `flex: 0 0 auto`) and difficulty-coloured
  chips. Also hardened `.pill`/`.badge` with `white-space: nowrap`.
- **Selectable Nearby.** Nearby places are now buttons; tapping one re-rolls the task centred on
  that place (`generateTask(rig, { context, focusPlace })` reuses the gathered context so the list
  stays stable and it's fast). New `GenerateTaskOptions`; prompt gained an optional `focusPlace`
  directive.
- **Open in Maps.** `NearbyPlace` now carries `lat/lon` (captured from the Overpass `center`/node
  coords we already fetched). `Task.destination` is set from the chosen place, or detected from a
  place named in the objective (`findMentionedPlace`). New `utils/maps.ts` builds an Apple/Google
  Maps URL (precise pin when coords exist) and `linkifyDestination` makes the place name in the
  objective a tappable link. Unit-tested in `utils/maps.test.ts`.

## 2026-06-21 — Project wiki established

Created this `wiki/` (mirroring the structure used in sibling projects): `index`, `architecture`
(Mermaid), `schema`, `concepts/`, `decisions/`, `runbooks/`, `sources/`, `experiments/`, and this
`log`. Added `AGENTS.md` and rewrote `README.md` to describe the product. Wiki content was written
against the **actual code** in `src/`, not just the design brief — notable reality vs. brief deltas:

- Product ships as **Iris** (`package.json` name, Dexie DB `iris`, PWA manifest `Iris`).
  "PhotoBuddy" remains the brief's working title.
- Deploy adapter is **`@sveltejs/adapter-vercel`** (`nodejs22.x`, SPA `ssr=false`), not
  `adapter-static` — equivalent static SPA output. No `svelte.config.js`; the adapter is configured
  inside the `sveltekit()` plugin in `vite.config.ts`.
- OpenRouter/OpenAI/Grok share one `OpenAICompatibleProvider`; Anthropic and Gemini have their own
  adapters. Registry switches on `settings.activeProvider`.
- Context layer includes a **nearby-places** source (`context/places.ts`) on top of geocode.

## 2026-06-20 — Scaffold + Phase-1 vertical slice in place

Repo scaffolded (SvelteKit + TS + Svelte 5 runes, pnpm). Present in `src/`: all domain types
(`types/`), Dexie schema v1 (`db/schema.ts`, 9 tables incl. `photos` Blob store), the five provider
adapters + registry + structured-output shaping + key validation (`llm/`), context gatherers
(`context/`: location, sunphase via suncalc, Open-Meteo weather, BigDataCloud geocode, places),
gear catalog + capability engine + augmentation (`gear/`), media pipeline (`media/`: exif,
downscale, capture, filepick), both pipelines (`pipelines/taskGeneration.ts`,
`pipelines/evaluation.ts`) with Zod validation + single retry + feasibility guard, stores, and the
five routes (`/`, `/gear`, `/session`, `/history`, `/settings`). PWA wired via
`@vite-pwa/sveltekit` (Workbox; Open-Meteo `NetworkFirst`, BigDataCloud `StaleWhileRevalidate`).

Core constraints recorded as [decisions/](decisions/README.md): client-side PWA / no backend; BYOK
multi-provider behind one abstraction; OpenRouter as the Phase-1 default; real-camera ingest via
camera roll + EXIF (WebUSB blocks camera PTP/MTP).

---

### Active / next (Phase 2)

- Gear catalog editor (add/edit body & lens); iPhone profile for phone mode.
- Validate Anthropic / Gemini / Grok adapters end-to-end with key-validation UI.
- Pre-session rig/lens picker; file-upload path for real-camera photos; EXIF GPS-vs-session
  mismatch (`geoMismatchMeters`).
- Capability engine polish: `maxApertureAt` for variable-aperture zooms, 35mm-equiv display.
- See [experiments/README.md](experiments/README.md) for model/prompt experiments to run.
