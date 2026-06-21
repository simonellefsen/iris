export interface GeocodedLocation {
	name?: string;
	country?: string;
	street?: string;
	neighbourhood?: string;
}

/** Reverse-geocode a lat/lon to a rich, street-level place description. Best-effort. */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation> {
	// BigDataCloud (keyless, CORS) for city/country; Nominatim for street/neighbourhood detail.
	const [bdc, nom] = await Promise.all([
		bigdatacloud(lat, lon).catch(() => null),
		nominatim(lat, lon).catch(() => null)
	]);
	return {
		name: bdc?.name ?? nom?.name,
		country: bdc?.country ?? nom?.country,
		street: nom?.street,
		neighbourhood: nom?.neighbourhood ?? bdc?.neighbourhood
	};
}

async function bigdatacloud(lat: number, lon: number): Promise<GeocodedLocation> {
	const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
	const res = await fetch(url);
	if (!res.ok) return {};
	const d = (await res.json()) as {
		city?: string;
		locality?: string;
		principalSubdivision?: string;
		countryName?: string;
	};
	return {
		name: d.city || d.locality || d.principalSubdivision,
		country: d.countryName
	};
}

async function nominatim(lat: number, lon: number): Promise<GeocodedLocation> {
	// Nominatim usage policy: max 1 req/sec, identify via Referer/UA. The browser sends Referer.
	const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
	const res = await fetch(url, { headers: { Accept: 'application/json' } });
	if (!res.ok) return {};
	const d = (await res.json()) as {
		name?: string;
		display_name?: string;
		address?: {
			road?: string;
			pedestrian?: string;
			neighbourhood?: string;
			suburb?: string;
			quarter?: string;
			city?: string;
			town?: string;
			village?: string;
			county?: string;
			country?: string;
		};
	};
	const a = d.address ?? {};
	return {
		name: d.name || a.city || a.town || a.village || a.suburb || a.county,
		country: a.country,
		street: a.road || a.pedestrian,
		neighbourhood: a.neighbourhood || a.suburb || a.quarter
	};
}
