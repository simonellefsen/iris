# Concept: the gear capability model

The single biggest way a photography coach loses trust is by handing out a brief the user's gear
**physically cannot do** — "shoot this at f/1.8" on an f/4.5–6.3 kit zoom, or "use 200mm" on a 50mm
prime. Iris prevents this in code, not by hoping the LLM behaves.

## The pieces

- **Catalog** ([gear/catalog.json](../../src/lib/gear/catalog.json) + `catalog.ts`) — curated body
  and lens data the user can extend. Each item carries a `source` (`catalog | llm-augmented | user`).
- **LLM augmentation** ([gear/augment.ts](../../src/lib/gear/augment.ts)) — for unknown gear, the
  LLM fills in specs, tagged `llm-augmented` and shown with an **"unverified" badge** + easy edit
  path (the model can guess a max aperture wrong, which would mis-constrain tasks).
- **Capability engine** ([gear/capability.ts](../../src/lib/gear/capability.ts)) — turns a body +
  lens into a `RigCapabilities`: focal range, crop factor, stabilization present, fastest aperture,
  and a `maxApertureAt(focalLength)` lookup.

## maxApertureAt — variable-aperture zooms

A zoom like a 24-105 f/4-7.1 does not have one max aperture; it changes with focal length. The lens
stores `maxAperture: {focalLength, maxAperture}[]` and `maxApertureAt(fl)`
([utils/aperture.ts](../../src/lib/utils/aperture.ts)) interpolates/looks up the widest aperture
available at the requested focal length. This is what the feasibility guard clamps against.

## enforceFeasibility — the guard

[`enforceFeasibility(task, cap)`](../../src/lib/gear/capability.ts) runs on every generated task
*after* the LLM and *before* the user sees it:

1. **Clamp focal length** to the lens range (`focalRangeMm.min..max`), for both number and
   `{min,max}` targets.
2. **Clamp aperture** so `apertureTarget` is never wider (smaller f-number) than the lens allows at
   the chosen focal length (`maxApertureAt(fl)`, falling back to the rig's fastest aperture).
3. **Derive the handheld shutter floor** from the reciprocal-focal rule on the **35mm-equivalent**
   focal length (`equivFocal` applies crop factor), relaxed when the rig has IBIS/OIS.
4. Apply the same aperture clamp to the task's `suggestedExposure`.

Phone-fixed bodies have no lens; the engine defaults to a sensible focal range so the loop still
works (see `rigCapabilities`).

## Crop factor / 35mm equivalence

Body `cropFactor` is used both for the handheld-shutter math and (Phase 2) to display 35mm-equiv
focal lengths so advice reads consistently across sensor formats.

Tested in [gear/capability.test.ts](../../src/lib/gear/capability.test.ts) and
[utils/lensSpec.test.ts](../../src/lib/utils/lensSpec.test.ts).
