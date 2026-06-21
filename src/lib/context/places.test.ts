import { describe, expect, it } from 'vitest';
import { classifyPlace, dedupePlaces } from './places';
import type { NearbyPlace } from '$lib/types/context';

describe('classifyPlace', () => {
	it('classifies parks, landmarks, water, nature, buildings', () => {
		expect(classifyPlace({ leisure: 'park', name: 'X' })).toBe('park');
		expect(classifyPlace({ tourism: 'attraction', name: 'X' })).toBe('landmark');
		expect(classifyPlace({ natural: 'water', name: 'X' })).toBe('water');
		expect(classifyPlace({ natural: 'peak', name: 'X' })).toBe('nature');
		expect(classifyPlace({ water: 'river', name: 'X' })).toBe('water');
		expect(classifyPlace({ building: 'yes', name: 'X' })).toBe('building');
		expect(classifyPlace({ historic: 'monument', name: 'X' })).toBe('historic');
		expect(classifyPlace({ amenity: 'cafe', name: 'X' })).toBe('place');
	});
});

describe('dedupePlaces', () => {
	it('removes duplicate names case-insensitively, preserving order', () => {
		const input: NearbyPlace[] = [
			{ name: 'Central Park', kind: 'park' },
			{ name: 'central park', kind: 'park' },
			{ name: 'Guggenheim', kind: 'landmark' }
		];
		expect(dedupePlaces(input)).toEqual([
			{ name: 'Central Park', kind: 'park' },
			{ name: 'Guggenheim', kind: 'landmark' }
		]);
	});
});
