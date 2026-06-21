# Source: context APIs (location, light, weather, places)

The context layer ([src/lib/context/](../../src/lib/context/)) turns "here and now" into a
`SessionContext { location, weather, light }`. Location is required; everything else degrades
gracefully (the loop still produces a task offline-ish, with `unknownWeather()` and empty places).

Orchestrated by `gatherContext()` ([context/index.ts](../../src/lib/context/index.ts)), which runs
geocode + weather + nearby-places in parallel and computes light locally.

## Geolocation — `navigator.geolocation`
[location.ts](../../src/lib/context/location.ts). Promise-wrapped with a timeout and a manual-entry
fallback. Requires a secure context (HTTPS / localhost) and a user gesture. Returns
`{ lat, lon, accuracyM }`.

## Light — suncalc (local, no network)
[sunphase.ts](../../src/lib/context/sunphase.ts). Uses `suncalc` to get sun elevation and classify
it into a phase band (golden-hour / blue-hour / night / daylight / …). Scans forward minute-by-
minute to compute `minutesUntilChange` so the coach knows how long the current light lasts. Pure
math — works offline.

## Weather — Open-Meteo (keyless)
[weather.ts](../../src/lib/context/weather.ts). `current=temperature_2m, cloud_cover, precipitation,
wind_speed_10m, uv_index`. No API key, CORS-friendly. Runtime-cached by the service worker
(`NetworkFirst`, 30 min). `unknownWeather()` is the graceful fallback.

## Reverse geocode — BigDataCloud (keyless) + nearby places
[geocode.ts](../../src/lib/context/geocode.ts). BigDataCloud client-info endpoint is keyless and
CORS-friendly → `{ name, country, street, neighbourhood }`. (Nominatim is the documented fallback —
rate-limited, requires an identified User-Agent.) Runtime-cached `StaleWhileRevalidate`, 30 days.
[places.ts](../../src/lib/context/places.ts) adds nearby points of interest for richer briefs;
tested in [places.test.ts](../../src/lib/context/places.test.ts).

## Caching summary (service worker)

| API | Strategy | TTL |
|-----|----------|-----|
| `api.open-meteo.com` | NetworkFirst (8s timeout) | 30 min |
| `api.bigdatacloud.net` | StaleWhileRevalidate | 30 days |

Configured in [vite.config.ts](../../vite.config.ts).
