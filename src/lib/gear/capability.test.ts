import { describe, expect, it } from 'vitest';
import { enforceFeasibility, rigCapabilities } from './capability';
import { formatAperture, maxApertureAt, parseAperture } from '$lib/utils/aperture';
import { equivFocal, formatShutter, minHandheldShutterSec, parseShutterSec } from '$lib/utils/focal';
import type { CameraBody, Lens } from '$lib/types/gear';
import type { SessionContext } from '$lib/types/context';
import type { Task } from '$lib/types/task';

const body: CameraBody = {
	id: 'b',
	make: 'Canon',
	model: 'EOS R8',
	mount: 'rf',
	sensor: 'full-frame',
	sensorSizeMm: { w: 36, h: 24 },
	cropFactor: 1,
	megapixels: 24,
	hasIBIS: false,
	maxShutter: '1/16000',
	minIso: 100,
	maxIso: 51200,
	isPhone: false,
	source: 'catalog'
};

const zoom: Lens = {
	id: 'l',
	make: 'Canon',
	model: 'RF 24-105 f/4-7.1',
	mount: 'rf',
	isPrime: false,
	focalLengthMm: { min: 24, max: 105 },
	maxAperture: [
		{ focalLength: 24, maxAperture: 4 },
		{ focalLength: 105, maxAperture: 7.1 }
	],
	hasOIS: true,
	source: 'catalog'
};

const prime: Lens = {
	id: 'p',
	make: 'Canon',
	model: 'RF 50mm f/1.8',
	mount: 'rf',
	isPrime: true,
	focalLengthMm: { min: 50, max: 50 },
	maxAperture: [{ focalLength: 50, maxAperture: 1.8 }],
	hasOIS: false,
	source: 'catalog'
};

const ctx: SessionContext = {
	location: { lat: 0, lon: 0, accuracyM: 0 },
	weather: { tempC: 0, cloudCoverPct: 0, precipitationMm: 0, windKph: 0, conditions: 'Clear', uvIndex: 0 },
	light: { phase: 'day', sunElevationDeg: 30, minutesUntilChange: 60, label: 'Day' }
};

function makeTask(overrides: Partial<Task>): Task {
	return {
		id: 't',
		createdAt: 0,
		objective: 'A clear and concrete shooting objective',
		techniqueTags: [],
		difficulty: 'intermediate',
		constraints: { compositionalRule: 'rule of thirds' },
		suggestedExposure: { aperture: 5.6, shutter: '1/250', iso: 200 },
		successCriteria: ['framed well'],
		coachingHints: [],
		context: ctx,
		rig: { bodyId: 'b', lensId: 'l' },
		...overrides
	};
}

describe('maxApertureAt', () => {
	it('returns the wide-end aperture at/below the first step', () => {
		expect(maxApertureAt(zoom.maxAperture, 24)).toBe(4);
	});
	it('interpolates between steps for a variable-aperture zoom', () => {
		// midpoint of 24..105 is 64.5 -> 4 + (7.1 - 4) / 2 = 5.55
		expect(maxApertureAt(zoom.maxAperture, 64.5)).toBeCloseTo(5.55, 1);
	});
	it('returns the long-end aperture past the last step', () => {
		expect(maxApertureAt(zoom.maxAperture, 105)).toBe(7.1);
	});
});

describe('aperture helpers', () => {
	it('parses various f-number formats', () => {
		expect(parseAperture('f/1.8')).toBe(1.8);
		expect(parseAperture('F2.8')).toBe(2.8);
		expect(parseAperture('1:1.4')).toBe(1.4);
		expect(parseAperture(4)).toBe(4);
	});
	it('formats f-numbers', () => {
		expect(formatAperture(2.8)).toBe('f/2.8');
		expect(formatAperture(4)).toBe('f/4');
	});
});

describe('focal helpers', () => {
	it('computes 35mm-equivalent focal length', () => {
		expect(equivFocal(50, 1.6)).toBeCloseTo(80, 5);
	});
	it('derives the handheld shutter floor', () => {
		// 50mm equiv, no stabilization -> 1/50 = 0.02s
		expect(minHandheldShutterSec(50, false)).toBeCloseTo(0.02, 5);
	});
	it('formats shutter speeds', () => {
		expect(formatShutter(1 / 250)).toBe('1/250');
		expect(formatShutter(2)).toBe('2"');
	});
	it('parses shutter strings', () => {
		expect(parseShutterSec('1/250')).toBeCloseTo(0.004, 6);
		expect(parseShutterSec('2"')).toBe(2);
	});
});

describe('rigCapabilities', () => {
	it('reports the widest aperture across the range', () => {
		expect(rigCapabilities(body, zoom).fastestAperture).toBe(4);
		expect(rigCapabilities(body, prime).fastestAperture).toBe(1.8);
	});
	it('reports stabilization from IBIS or OIS', () => {
		expect(rigCapabilities(body, zoom).hasStabilization).toBe(true); // OIS
		expect(rigCapabilities(body, prime).hasStabilization).toBe(false);
	});
});

describe('enforceFeasibility', () => {
	it('clamps an impossible aperture to the lens max at the target focal length', () => {
		const cap = rigCapabilities(body, zoom);
		const task = makeTask({
			constraints: { focalLengthTarget: 24, apertureTarget: 1.8, compositionalRule: 'x' },
			suggestedExposure: { aperture: 1.8, shutter: '1/250', iso: 200 }
		});
		const f = enforceFeasibility(task, cap);
		expect(f.constraints.apertureTarget).toBe(4);
		expect(f.suggestedExposure.aperture).toBe(4);
	});
	it('clamps focal length into the lens range', () => {
		const cap = rigCapabilities(body, zoom);
		const task = makeTask({
			constraints: { focalLengthTarget: 200, compositionalRule: 'x' }
		});
		const f = enforceFeasibility(task, cap);
		expect(f.constraints.focalLengthTarget).toBe(105);
	});
	it('clamps a focal range target into the lens range', () => {
		const cap = rigCapabilities(body, zoom);
		const task = makeTask({
			constraints: { focalLengthTarget: { min: 10, max: 300 }, compositionalRule: 'x' }
		});
		const f = enforceFeasibility(task, cap);
		expect(f.constraints.focalLengthTarget).toEqual({ min: 24, max: 105 });
	});
	it('always sets a handheld shutter floor', () => {
		const cap = rigCapabilities(body, prime);
		const f = enforceFeasibility(makeTask({ rig: { bodyId: 'b', lensId: 'p' } }), cap);
		expect(f.constraints.minShutterForHandheld).toBeTruthy();
	});
});
