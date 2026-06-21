export interface Coords {
	lat: number;
	lon: number;
	accuracyM: number;
}

export function isGeolocationAvailable(): boolean {
	return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

/**
 * Resolve the current position. Supports a `?debugLocation=lat,lon` query override for
 * testing without moving. Rejects if geolocation is denied/unavailable.
 */
export function getPosition(highAccuracy = true): Promise<Coords> {
	if (typeof window !== 'undefined') {
		const m = /(?:[?&]debugLocation=)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(
			window.location.search
		);
		if (m) return Promise.resolve({ lat: Number(m[1]), lon: Number(m[2]), accuracyM: 1 });
	}
	if (!isGeolocationAvailable()) {
		return Promise.reject(new Error('Geolocation is not available in this browser.'));
	}
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				resolve({
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
					accuracyM: pos.coords.accuracy ?? 0
				}),
			(err) => reject(new Error(geoErr(err))),
			{ enableHighAccuracy: highAccuracy, timeout: 10_000, maximumAge: 30_000 }
		);
	});
}

function geoErr(err: GeolocationPositionError): string {
	switch (err.code) {
		case 1:
			return 'Location permission denied.';
		case 2:
			return 'Location unavailable.';
		case 3:
			return 'Location request timed out.';
		default:
			return err.message || 'Location error.';
	}
}

/** Great-circle distance between two points, in meters (haversine). */
export function distanceMeters(
	a: { lat: number; lon: number },
	b: { lat: number; lon: number }
): number {
	const R = 6_371_000;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lon - a.lon);
	const s =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
}
