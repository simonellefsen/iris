import { describe, expect, it } from 'vitest';
import { findMentionedPlace, linkifyDestination, mapsUrl } from './maps';
import type { NearbyPlace } from '$lib/types/context';

const nearby: NearbyPlace[] = [
	{ name: 'Kælkebakke', kind: 'park', lat: 55.66, lon: 12.6 },
	{ name: 'Park', kind: 'park' },
	{ name: 'PureGym', kind: 'leisure' }
];

describe('findMentionedPlace', () => {
	it('finds a place named in the objective', () => {
		const m = findMentionedPlace('Walk to Kælkebakke and shoot leading lines', nearby);
		expect(m?.name).toBe('Kælkebakke');
	});

	it('prefers the longest match', () => {
		const places: NearbyPlace[] = [
			{ name: 'Park', kind: 'park' },
			{ name: 'Park Lake', kind: 'water' }
		];
		expect(findMentionedPlace('shoot at Park Lake', places)?.name).toBe('Park Lake');
	});

	it('returns undefined when nothing matches or list is empty', () => {
		expect(findMentionedPlace('shoot a generic street scene', nearby)).toBeUndefined();
		expect(findMentionedPlace('anything', undefined)).toBeUndefined();
	});
});

describe('linkifyDestination', () => {
	it('splits around the first case-insensitive occurrence', () => {
		expect(linkifyDestination('Walk to Kælkebakke now', 'kælkebakke')).toEqual({
			before: 'Walk to ',
			match: 'Kælkebakke',
			after: ' now'
		});
	});

	it('returns null when the name is absent', () => {
		expect(linkifyDestination('no place here', 'Kælkebakke')).toBeNull();
	});
});

describe('mapsUrl', () => {
	// jsdom does not report as iOS, so we exercise the Google Maps branch.
	it('uses precise coordinates when available', () => {
		const url = mapsUrl({ name: 'Kælkebakke', lat: 55.66, lon: 12.6 });
		expect(url).toBe('https://www.google.com/maps/search/?api=1&query=55.66%2C12.6');
	});

	it('falls back to a name search disambiguated by location', () => {
		const url = mapsUrl(
			{ name: 'Kælkebakke' },
			{ lat: 0, lon: 0, accuracyM: 1, neighbourhood: 'Sundbyøster', name: 'Copenhagen' }
		);
		expect(url).toContain('https://www.google.com/maps/search/?api=1&query=');
		expect(decodeURIComponent(url)).toContain('Kælkebakke, Sundbyøster, Copenhagen');
	});
});
