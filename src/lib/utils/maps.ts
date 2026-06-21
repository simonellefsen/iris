import type { LocationContext, NearbyPlace } from '$lib/types/context';
import type { TaskDestination } from '$lib/types/task';

/** Best-effort iOS/iPadOS detection so we can prefer Apple Maps deep links. */
export function isIOS(): boolean {
	if (typeof navigator === 'undefined') return false;
	const ua = navigator.userAgent || '';
	if (/iP(hone|ad|od)/.test(ua)) return true;
	// iPadOS 13+ reports as MacIntel but is touch-capable.
	return navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1;
}

/**
 * Build a URL that opens the device's default map app at `dest`. Prefers exact
 * coordinates (a precise pin); falls back to a name search disambiguated by the
 * session location. Apple Maps on iOS, Google Maps elsewhere.
 */
export function mapsUrl(dest: TaskDestination, loc?: LocationContext): string {
	const hasCoords = typeof dest.lat === 'number' && typeof dest.lon === 'number';
	const label = encodeURIComponent(dest.name);
	const near = [dest.name, loc?.neighbourhood, loc?.name, loc?.country].filter(Boolean).join(', ');
	const query = encodeURIComponent(near || dest.name);

	if (isIOS()) {
		return hasCoords
			? `https://maps.apple.com/?q=${label}&ll=${dest.lat},${dest.lon}`
			: `https://maps.apple.com/?q=${query}`;
	}
	return hasCoords
		? `https://www.google.com/maps/search/?api=1&query=${dest.lat}%2C${dest.lon}`
		: `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Find a nearby place named in the objective text (e.g. "Walk to Kælkebakke …"),
 * preferring the longest match so "Park Lake" wins over "Park". Returns the place
 * (with coords) so the task can offer a precise map link.
 */
export function findMentionedPlace(
	objective: string,
	nearby: NearbyPlace[] | undefined
): NearbyPlace | undefined {
	if (!nearby?.length) return undefined;
	const lower = objective.toLowerCase();
	return nearby
		.filter((p) => p.name.trim().length >= 3 && lower.includes(p.name.toLowerCase()))
		.sort((a, b) => b.name.length - a.name.length)[0];
}

export interface LinkifyParts {
	before: string;
	match: string;
	after: string;
}

/**
 * Split `text` around the first case-insensitive occurrence of `name` so the UI
 * can render that span as a link. Returns null when `name` is absent.
 */
export function linkifyDestination(text: string, name: string): LinkifyParts | null {
	if (!name) return null;
	const i = text.toLowerCase().indexOf(name.toLowerCase());
	if (i < 0) return null;
	return {
		before: text.slice(0, i),
		match: text.slice(i, i + name.length),
		after: text.slice(i + name.length)
	};
}
