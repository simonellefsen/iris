# Source: gear catalog

The curated gear data that seeds the capability engine. Canonical data:
[src/lib/gear/catalog.json](../../src/lib/gear/catalog.json), loaded via
[catalog.ts](../../src/lib/gear/catalog.ts) (`getBody`, `getLens`).

## Shape

- **bodies** — see `CameraBody` in [schema.md](../schema.md#gear-typesgearts): make/model, mount,
  sensor format + size, `cropFactor`, megapixels, `hasIBIS`, shutter + ISO ranges, `isPhone`,
  `source`.
- **lenses** — see `Lens`: make/model, mount, `isPrime`, `focalLengthMm` (prime number or
  `{min,max}`), `maxAperture: {focalLength, maxAperture}[]` (variable-aperture aware), `hasOIS`,
  `source`.

## Phase-1 seed

Phase 1 hardcodes a minimal catalog — **Canon EOS R8** body + **RF 50mm f/1.8** lens — enough to
prove the end-to-end loop on a real rig.

## Augmentation & provenance

Unknown gear can be filled in by the LLM ([augment.ts](../../src/lib/gear/augment.ts)) and is
tagged `source: 'llm-augmented'` with an **"unverified" badge** + edit path in the UI, because the
model can get a max aperture wrong and mis-constrain tasks. User-entered gear is `source: 'user'`.

See [concepts/gear-capability-model.md](../concepts/gear-capability-model.md) for how this data
becomes feasibility constraints.
