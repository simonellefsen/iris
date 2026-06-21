/** Reverse-geocode a lat/lon to a human-readable place name. Best-effort, never throws. */
export async function reverseGeocode(
	lat: number,
	lon: number
): Promise<{ name?: string; country?: string }> {
	// Primary: BigDataCloud client-info endpoint — keyless, CORS-friendly.
	try {
		const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
		const res = await fetch(url);
		if (res.ok) {
			const d = (await res.json()) as {
				city?: string;
				locality?: string;
				principalSubdivision?: string;
				countryName?: string;
			};
			const name = d.city || d.locality || d.principalSubdivision;
			if (name) return { name, country: d.countryName };
		}
	} catch {
		// fall through to Nominatim
	}

	// Fallback: Nominatim (rate-limited; browser sends Referer automatically).
	try {
		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
		const res = await fetch(url, { headers: { Accept: 'application/json' } });
		if (res.ok) {
			const d = (await res.json()) as {
				name?: string;
				address?: {
					city?: string;
					town?: string;
					village?: string;
					suburb?: string;
					county?: string;
					country?: string;
				};
			};
			const a = d.address ?? {};
			const name = d.name || a.city || a.town || a.village || a.suburb || a.county;
			if (name) return { name, country: a.country };
		}
	} catch {
		// give up silently
	}

	return {};
}
