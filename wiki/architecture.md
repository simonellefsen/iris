# Architecture

System architecture of Iris: a pure client-side PWA with **no backend**. The browser talks
directly to public context APIs (weather, geocode) and to the user's chosen LLM provider with a
BYOK key. All state lives in IndexedDB. All diagrams are Mermaid (render on GitHub).

Cross-references: [index.md](index.md) · [schema.md](schema.md) ·
[concepts/gear-capability-model.md](concepts/gear-capability-model.md) ·
[decisions/2026-06-20-client-side-pwa-no-backend.md](decisions/2026-06-20-client-side-pwa-no-backend.md).

## 1. System / deployment topology

Everything runs in the browser. No server holds user data or API keys.

```mermaid
flowchart TB
  subgraph device["User's device (browser / installed PWA)"]
    ui["SvelteKit SPA\nroutes: / · /gear · /session · /history · /settings"]
    sw["Service worker (Workbox)\nprecache shell + runtime-cache APIs"]
    idb[("IndexedDB (Dexie 'iris')\nsettings · gear · tasks · submissions ·\nevaluations · sessions · photos(Blob)")]
    ui <--> idb
    sw -. caches .- ui
  end

  subgraph ctx["Context APIs (public, keyless)"]
    om["Open-Meteo\ncurrent weather"]
    bdc["BigDataCloud\nreverse geocode"]
    geo["navigator.geolocation\n(device)"]
  end

  subgraph llm["LLM provider (BYOK, user-chosen)"]
    or["OpenRouter / OpenAI / Grok\n(OpenAI-compatible)"]
    an["Anthropic (Claude)"]
    gm["Google Gemini"]
  end

  ui --> geo
  ui --> om
  ui --> bdc
  ui -->|"text: task gen"| or
  ui -->|"text + image: eval"| or
  ui --> an
  ui --> gm

  classDef ext fill:#1b2a3a,stroke:#2f5d8a,color:#cfe;
  class om,bdc,geo,or,an,gm ext;
```

- **No backend.** Static build (`adapter-vercel`, `ssr=false`) → a fallback `index.html` SPA.
  HTTPS in prod is required for geolocation, camera, and the service worker.
- **Keys never leave the device** except in the request to the provider the user selected. They
  are stored in IndexedDB, never logged, never put in a URL.
- The service worker precaches the app shell and runtime-caches Open-Meteo (`NetworkFirst`, 30 min)
  and BigDataCloud (`StaleWhileRevalidate`, 30 days). See [vite.config.ts](../vite.config.ts).

## 2. Task-generation loop (`/session` start)

```mermaid
flowchart LR
  A["gatherContext()"] --> A1["navigator.geolocation\n(required)"]
  A --> A2["Open-Meteo weather\n(graceful fallback)"]
  A --> A3["BigDataCloud geocode\n+ nearby places (fallback)"]
  A --> A4["suncalc → light phase\n(golden/blue/night…)"]
  R["resolveRig() →\nrigCapabilities()"] --> P
  A1 & A2 & A3 & A4 --> P["assemble prompt\n(TASK_SYSTEM + JSON blob)"]
  P --> S["provider.generateStructured()\nZod JSON schema, temp 0.8"]
  S --> V{"Zod-valid?"}
  V -- no --> RT["retry once\n(error appended, temp 0.4)"]
  RT --> V
  V -- yes --> EF["enforceFeasibility()\nclamp FL/aperture/shutter to rig"]
  EF --> T["Task persisted\n(Dexie tasks)"]

  classDef gate fill:#3a2f1b,stroke:#8a6a2f,color:#fe7;
  class V gate;
```

Source: [src/lib/pipelines/taskGeneration.ts](../src/lib/pipelines/taskGeneration.ts). The
**feasibility guard** ([gear/capability.ts](../src/lib/gear/capability.ts)) is cheap insurance —
the LLM never gets to assign f/1.8 to an f/4.5 kit lens, or a focal length outside the lens range.
See [concepts/gear-capability-model.md](concepts/gear-capability-model.md).

## 3. Evaluation loop (submit a photo)

```mermaid
flowchart LR
  F["user picks/captures\nimage File"] --> E["exifr parse\n(EXIF/GPS/XMP) FIRST"]
  E --> D["downscale ≤1568px JPEG\n(canvas strips EXIF — already read)"]
  D --> P["prompt: EVAL_SYSTEM +\nTask + ExifSnapshot + rig caps + image block"]
  P --> S["vision provider.generateStructured()\nZod Evaluation schema, temp 0.3"]
  S --> V{"Zod-valid?"}
  V -- no --> RT["retry once\n(temp 0.2)"]
  RT --> V
  V -- yes --> O["overallScore\n(or mean of dimensions)"]
  O --> ST["store Submission + Evaluation\n+ photo Blob + thumbnail"]

  classDef gate fill:#3a2f1b,stroke:#8a6a2f,color:#fe7;
  class V gate;
```

Source: [src/lib/pipelines/evaluation.ts](../src/lib/pipelines/evaluation.ts). **Order matters:**
parse EXIF from the raw `File` *before* any canvas op, because `canvas`/`toDataURL` strips
metadata. Only providers with `supportsVision` are allowed to run this. HEIC is decoded to JPEG in
the downscale step.

## 4. LLM provider abstraction

One interface, raw `fetch` everywhere (no SDK bundled), uniform error handling.

```mermaid
flowchart TB
  reg["registry.ts\nactiveProvider() / getProvider(key)"] --> sw{"key"}
  sw -- "openrouter / openai / grok" --> oc["OpenAICompatibleProvider\nChat Completions + response_format json_schema"]
  sw -- anthropic --> ap["AnthropicProvider\nsingle tool whose input_schema = schema"]
  sw -- gemini --> gp["GeminiProvider\nresponseMimeType + responseSchema"]
  oc & ap & gp --> iface["LLMProvider\ngenerateStructured() · validateKey() · supportsVision"]
  meta["providers.ts (PROVIDERS)\nbaseURL · authType · default models · visionQuality"] --> reg

  classDef adv fill:#2a2333,stroke:#6a4f8a,color:#dcf;
  class oc,ap,gp adv;
```

Sources: [provider.ts](../src/lib/llm/provider.ts) (interface),
[registry.ts](../src/lib/llm/registry.ts) (factory by `settings.activeProvider`),
[providers.ts](../src/lib/llm/providers.ts) (metadata), [structured.ts](../src/lib/llm/structured.ts)
(per-provider JSON-schema/tool-call shaping + `zodToJsonSchema`).

Auth per provider:

| Provider | Adapter | Auth header | Vision |
|----------|---------|-------------|--------|
| OpenRouter | OpenAICompatible | `Authorization: Bearer` | strong |
| OpenAI | OpenAICompatible | `Authorization: Bearer` | strong |
| xAI Grok | OpenAICompatible | `Authorization: Bearer` | fair |
| Anthropic | Anthropic | `x-api-key` + `anthropic-version` + `anthropic-dangerous-direct-browser-access: true` | strong |
| Gemini | Gemini | `x-goog-api-key` | strong |

The Anthropic `anthropic-dangerous-direct-browser-access: true` header is the **critical
browser opt-in** — without it the request is blocked. All five endpoints are CORS-capable from the
browser. See [sources/llm-providers.md](sources/llm-providers.md).

## 5. Data model (high level)

```mermaid
erDiagram
  bodies ||--o{ gearProfiles : "bodyId"
  lenses ||--o{ gearProfiles : "lensIds"
  tasks ||--o{ submissions : "taskId"
  submissions ||--|| evaluations : "submissionId"
  submissions ||--|| photos : "photoBlobKey"
  sessions }o--|| tasks : "taskId"

  tasks {
    string id PK
    string objective
    object constraints
    object suggestedExposure
    object context "location+weather+light"
    object rig
  }
  submissions {
    string id PK
    string taskId
    string photoBlobKey
    string thumbnailDataUrl
    object exif
  }
  evaluations {
    string id PK
    string submissionId
    number overallScore
    array dimensions
  }
```

Photo binary is stored as a native `Blob` in the `photos` table (keyed by
`submission.photoBlobKey`); a tiny `thumbnailDataUrl` is generated at submit time so history
renders without fetching blobs. Full table list + invariants: [schema.md](schema.md).

## Routes / surfaces

| Route | What |
|-------|------|
| `/` | Home / start a session |
| `/gear` | Gear setup + pre-session rig (body + lens) pick |
| `/session` | context → task → shoot → eval |
| `/history` | Past sessions, scores, thumbnails (persisted in IndexedDB) |
| `/settings` | Provider / model / API key / skill level |

The whole app is `ssr=false`, `prerender=false` (see
[src/routes/+layout.ts](../src/routes/+layout.ts)) — it is a client-only SPA.
