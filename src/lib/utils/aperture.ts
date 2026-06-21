import type { ApertureStep } from '$lib/types/gear';

/** Format an f-number: 2.8 -> "f/2.8", 4 -> "f/4". */
export function formatAperture(f: number): string {
	return `f/${Number.isInteger(f) ? f : f}`;
}

/** Parse "f/1.8", "F1.8", "1:1.8", "1.8" -> 1.8. */
export function parseAperture(s: string | number): number | undefined {
	if (typeof s === 'number') return Number.isFinite(s) ? s : undefined;
	const m = s
		.replace(/\s/g, '')
		.replace(/^1:/, 'f/')
		.match(/(?:f\/?|F)?([0-9]+(?:\.[0-9]+)?)/i);
	return m ? Number(m[1]) : undefined;
}

/**
 * Max aperture available at a given focal length, interpolating between steps for
 * variable-aperture zooms (e.g. 24-105 f/4-7.1). Returns undefined if unknown.
 */
export function maxApertureAt(steps: ApertureStep[], focalLength: number): number | undefined {
	if (!steps.length) return undefined;
	const sorted = [...steps].sort((a, b) => a.focalLength - b.focalLength);
	if (focalLength <= sorted[0].focalLength) return sorted[0].maxAperture;
	const last = sorted[sorted.length - 1];
	if (focalLength >= last.focalLength) return last.maxAperture;
	for (let i = 0; i < sorted.length - 1; i++) {
		const a = sorted[i];
		const b = sorted[i + 1];
		if (focalLength >= a.focalLength && focalLength <= b.focalLength) {
			const t = (focalLength - a.focalLength) / (b.focalLength - a.focalLength);
			return round2(a.maxAperture + t * (b.maxAperture - a.maxAperture));
		}
	}
	return last.maxAperture;
}

export function round2(n: number): number {
	return Math.round(n * 100) / 100;
}
