# Runbook: manual QA (acceptance walkthrough)

The end-to-end acceptance check for a build. Run on **desktop Chrome** and **iOS Safari** (the two
platforms that exercise the most divergent code paths: file picker vs. `capture`, HEIC, storage
partitioning).

## Happy path

1. **Settings** — paste a provider key (OpenRouter by default). The key-validation badge goes
   **green**. Pick a skill level.
2. **Gear** — select the **Canon EOS R8 + RF 50/1.8** rig (Phase-1 seed).
3. **Start session** — the context card shows the correct **light phase** (e.g. golden hour),
   weather, and location name.
4. **Task feasibility** — the task's aperture / focal-length constraints are achievable on the
   50/1.8 (no f/1.4, no focal length off a prime). This is `enforceFeasibility` doing its job.
5. **Shoot & submit** — capture/upload a photo. **EXIF populates** (make/model/focal/aperture/ISO).
6. **Evaluation** — a rubric (Composition, Exposure/Technical, Constraint Adherence, Creativity)
   with rationale + an overall score comes back.
7. **History** — shows the thumbnail + score and **persists across reload** (IndexedDB).

## Offline / degradation

8. **Airplane mode** — the app shell loads, the session/history list renders, and starting a new
   session **fails gracefully** with a clear offline message (the live coaching flow needs the
   network). Cached weather/geocode may still serve.

## Platform-specific checks

- **iOS Safari**: HEIC capture decodes to JPEG for eval; EXIF still read from the HEIC original.
  Installed PWA storage is separate from Safari — install once, always open the icon.
- **EXIF integrity**: upload an *original* file (not a re-shared copy) — some Android share flows
  re-encode and strip EXIF.
- **RAW**: selecting a RAW file shows a helpful "not supported in Phase 1" message.
- **Quota**: only downscaled copies (~150–400 KB) + thumbnails are stored; originals are not.

## Regression net

`pnpm check && pnpm test` must pass before a build is considered shippable (see
[build-test-deploy.md](build-test-deploy.md)).
