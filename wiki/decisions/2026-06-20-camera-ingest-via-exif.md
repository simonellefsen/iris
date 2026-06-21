# Decision: real-camera ingest = camera roll + EXIF (not WebUSB)

**Date**: 2026-06-20
**Status**: accepted (core constraint)

## Context

A core promise is coaching on photos from a *real* camera, and knowing the camera/lens/settings
actually used. The instinct is "plug the camera into the phone and read it."

## Key constraint discovered in research

**A browser cannot read a real camera over USB.** WebUSB intentionally blocks the PTP/MTP device
classes that cameras use. So there is no direct camera→app transfer in a PWA.

## Decision

Realize "camera → app" as:

```
camera → its own app (e.g. Canon Camera Connect over Wi-Fi/BT) → phone camera roll
       → user picks the file in Iris → we parse EXIF
```

- **Ingest** = camera-roll / Files **upload** + **EXIF parse**; phone mode also offers in-app
  capture via `<input type="file" accept="image/*" capture="environment">` (most robust across
  iOS/Android/desktop). `getUserMedia` only for an optional live preview.
- **EXIF is how we learn the actual gear/settings** for a shot
  ([media/exif.ts](../../src/lib/media/exif.ts), exifr). Parse the raw `File` **before** any canvas
  op, because canvas strips metadata ([media/downscale.ts](../../src/lib/media/downscale.ts)).
- **Phone "auto-extract specs"** = read EXIF (make/model/focal/aperture) + infer device capability
  from the curated phone profile / LLM. There is no browser API listing a phone's full hardware.
- **RAW is rejected** in Phase 1 with a helpful message (vision models don't take RAW; in-browser
  RAW decode is impractical). exifr still reads metadata from many RAW bodies for later.
- **EXIF GPS vs session location** mismatch (`geoMismatchMeters`) flags "did you really shoot here?"

## Consequences

- Document for users: *upload the original, not a re-shared copy* — some Android share-to-browser
  flows re-encode and strip EXIF.
- HEIC (iPhone default) is decoded to JPEG in the downscale step; EXIF is read from the original
  HEIC by exifr.
- See [concepts/photography-coaching.md](../concepts/photography-coaching.md) and the evaluation
  loop in [architecture.md](../architecture.md#3-evaluation-loop-submit-a-photo).
