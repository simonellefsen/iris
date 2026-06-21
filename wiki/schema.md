# Data Schema

**Engine**: IndexedDB via [Dexie](https://dexie.org/) v4
**Database name**: `iris`
**Access**: typed `Table<T>` + `liveQuery` (reactive Svelte 5 runes wrap it in `stores/`)
**Conventions**: stable string ids (`uid('task')` etc., see [utils/id.ts](../src/lib/utils/id.ts)),
`createdAt` epoch-millis timestamps, plain JSON values (sync-friendly even though there is no sync).

Source of truth: [src/lib/db/schema.ts](../src/lib/db/schema.ts) (the `IrisDB` class) and
[src/lib/types/](../src/lib/types/) (the domain types). **This document is the contract** — keep
the Dexie store definition, the TS types, and this page in sync.

## Tables (Dexie v1)

```
settings       &id                              (singleton, id = 'app')
bodies         &id, mount, isPhone
lenses         &id, mount
gearProfiles   &id, bodyId
tasks          &id, createdAt
submissions    &id, taskId, createdAt
evaluations    &id, submissionId
sessions       &id, startedAt, taskId
photos         &key, createdAt                  (raw Blob store)
```

`&` marks the primary key; the remaining names are secondary indexes (FKs + `createdAt` for
time-ordered history). The `photos` table holds `{ key, blob, createdAt }` records keyed by
`submission.photoBlobKey`.

> Schema migrations use Dexie's versioning: bump `this.version(n).stores({...})` in
> [schema.ts](../src/lib/db/schema.ts) and add an `.upgrade()` if data needs transforming. Update
> this page in the same change.

## Domain models

Full TypeScript lives in [src/lib/types/](../src/lib/types/). Sketches:

### Gear ([types/gear.ts](../src/lib/types/gear.ts))
- **CameraBody** — `make, model, mount, sensor format, sensorSizeMm, cropFactor, megapixels,
  hasIBIS, maxShutter, iso range, isPhone, source(catalog|llm-augmented|user)`.
- **Lens** — `make, model, mount, isPrime, focalLengthMm (prime number or {min,max}),
  maxAperture: {focalLength, maxAperture}[]` (handles variable-aperture zooms like a 24-105
  f/4-7.1), `hasOIS, source`.
- **GearProfile** — `bodyId + owned lensIds` (what the user owns).
- **ActiveRig** — `bodyId + selected lensId` (what they're shooting with right now). A phone-fixed
  body has no `lensId`.

### Task ([types/task.ts](../src/lib/types/task.ts))
`objective, techniqueTags, constraints (focalLengthTarget, apertureTarget, minShutterForHandheld,
isoMax, motionType, compositionalRule), suggestedExposure {aperture, shutter, iso, note},
successCriteria[], coachingHints[], difficulty`, plus an embedded `context` and `rig`. The LLM
output is validated by `taskOutputSchema` ([pipelines/schemas.ts](../src/lib/pipelines/schemas.ts));
the client fills `id`/`createdAt`/`context`/`rig`.

### Context ([types/context.ts](../src/lib/types/context.ts))
- **LocationContext** — `lat/lon/accuracyM, name, country, street, neighbourhood, nearby[]`.
- **WeatherContext** — `tempC, cloudCoverPct, precipitationMm, windKph, conditions, uvIndex`.
- **LightContext** — `phase (golden-hour/blue-hour/night/…), sunElevationDeg, minutesUntilChange,
  label` (from suncalc).
- **SessionContext** — `{ location, weather, light }`, produced by `gatherContext()`.

### Submission ([types/submission.ts](../src/lib/types/submission.ts))
`taskId, photoBlobKey (→ photos table), thumbnailDataUrl, exif: ExifSnapshot, source
(phone-capture|file-upload), geoMismatchMeters` (EXIF GPS vs session location — flags "did you
really shoot here?").
- **ExifSnapshot** — `make, model, lensModel, focalLengthMm, aperture, exposureTimeSec, iso,
  dateTimeOriginal, gps, orientation, dims`.

### Evaluation ([types/evaluation.ts](../src/lib/types/evaluation.ts))
`overallScore (0-100), dimensions: RubricDimension[]` (Composition, Exposure/Technical, Constraint
Adherence, Creativity — each `score + rationale`), `summary, strengths[], improvements[],
constraintViolations[], modelUsed`. Validated by `evaluationOutputSchema`; if `overallScore` is
omitted it's derived from the mean of the dimension scores.

### CoachingSession ([types/session.ts](../src/lib/types/session.ts))
Ties `rig + context + task + submission + evaluation` together for the history view.

### Settings ([types/settings.ts](../src/lib/types/settings.ts))
`providers: Record<ProviderKey, ProviderConfig>` (`apiKey, textModel, visionModel`),
`activeProvider, skillLevel, units, llmAugmentGear`. `ProviderKey` ∈
`openrouter | openai | anthropic | gemini | grok`. Stored as a single row with `id = 'app'`.

## Invariants & rules

- **API keys live only in IndexedDB** — never localStorage, never a URL, never logged.
- **Parse EXIF before downscaling** — the canvas path strips metadata; the raw `File` is the only
  source of truth for camera/lens/settings used.
- **Only downscaled copies are stored** (~150–400 KB JPEG, longest side ≤1568px). Originals stay in
  the camera roll. A 128px `thumbnailDataUrl` (~5–10 KB) is stored for fast history rendering.
- **RAW is rejected in Phase 1** (vision models don't accept RAW; in-browser RAW decode is
  impractical). exifr can still read metadata from many RAW bodies for later.
- **Every Evaluation references a Submission; every Submission references a Task and a photo Blob.**

## iOS / quota notes
- iOS gives ~1 GB origin quota, but IndexedDB may be evicted after 7 days of inactivity under
  storage pressure (the `navigator.storage.persist()` API is not honored on iOS).
- Mitigations: store only downscaled copies; offer "export session" (JSON+ZIP) and "free up space"
  (drop blobs older than N days while keeping metadata + thumbnails). Call
  `navigator.storage.persist()` where honored (desktop/Android; harmless no-op on iOS).
- An **installed iOS PWA runs in a separate WKWebView with its own storage partition** — data in
  Safari ≠ data in the installed app. Tell users to install once and always open the icon.
