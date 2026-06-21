import type { NearbyPlace } from '$lib/types/context';

/** Overpass endpoints tried in order (the main one 406s without an Accept header / under load). */
const OVERPASS_ENDPOINTS = [
	'https://overpass-api.de/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter',
	'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

/**
 * Fetch named nearby features (parks, landmarks, buildings, water, historic sites)
 * from OpenStreetMap via Overpass. Free, keyless. Best-effort: returns [] on any
 * failure so session start never breaks.
 */
export async function getNearbyPlaces(
	lat: number,
	lon: number,
	radiusM = 500
): Promise<NearbyPlace[]> {
	const q = `[out:json][timeout:8];(
node(around:${radiusM},${lat},${lon})["name"]["tourism"];
node(around:${radiusM},${lat},${lon})["name"]["historic"];
node(around:${radiusM},${lat},${lon})["name"]["leisure"];
node(around:${radiusM},${lat},${lon})["name"]["natural"];
way(around:${radiusM},${lat},${lon})["name"]["tourism"];
way(around:${radiusM},${lat},${lon})["name"]["leisure"];
way(around:${radiusM},${lat},${lon})["name"]["water"];
);out tags center 30;`;

	for (const endpoint of OVERPASS_ENDPOINTS) {
		const result = await queryOverpass(endpoint, q);
		if (result) return dedupePlaces(result).slice(0, 24);
	}
	return [];
}

async function queryOverpass(
	endpoint: string,
	q: string
): Promise<NearbyPlace[] | null> {
	try {
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), 9000);
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json'
			},
			body: 'data=' + encodeURIComponent(q),
			signal: ctrl.signal
		});
		clearTimeout(timer);
		if (!res.ok) return null;
		const data = (await res.json()) as { elements?: { tags?: Record<string, string> }[] };
		if (!data || !Array.isArray(data.elements)) return null;
		const out: NearbyPlace[] = [];
		for (const el of data.elements) {
			const tags = el.tags ?? {};
			if (!tags.name) continue;
			out.push({ name: tags.name, kind: classifyPlace(tags) });
		}
		return out;
	} catch {
		return null;
	}
}

/** Categorise an OSM element by its tags into a photography-relevant kind. */
export function classifyPlace(tags: Record<string, string>): string {
	if (tags.leisure) return tags.leisure === 'park' || tags.leisure === 'garden' ? 'park' : 'leisure';
	if (tags.tourism) return 'landmark';
	if (tags.historic) return 'historic';
	if (tags.natural)
		return ['water', 'bay', 'beach', 'spring', 'lake', 'pond'].includes(tags.natural)
			? 'water'
			: 'nature';
	if (tags.water) return 'water';
	if (tags.building) return 'building';
	return 'place';
}

/** Deduplicate by name (case-insensitive), keeping the first occurrence. */
export function dedupePlaces(places: NearbyPlace[]): NearbyPlace[] {
	const seen = new Set<string>();
	const out: NearbyPlace[] = [];
	for (const p of places) {
		const key = p.name.trim().toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(p);
	}
	return out;
}
