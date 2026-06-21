/**
 * Parse a lens model string to extract focal length and max aperture, and reason
 * about lens mounts / adapters (e.g. an EF lens on an RF body needs an EF-EOS R adapter).
 */

export interface ParsedLensSpec {
	isPrime?: boolean;
	flMin?: number;
	flMax?: number;
	apertureWide?: number; // max aperture at the wide end
	apertureTele?: number; // max aperture at the tele end (variable-aperture zooms)
}

const FOCAL_RANGE = /(\d{1,3}(?:\.\d+)?)\s*-\s*(\d{1,3}(?:\.\d+)?)\s*mm/;
const FOCAL_SINGLE = /(?:^|[^\d.])(\d{1,3}(?:\.\d+)?)\s*mm/;
// `\b` prevents matching the trailing "f" in "RF"/"RF-S" as an aperture marker.
const AP_RANGE = /(?:\bf\/?|\b1:)\s*([0-9]{1,2}(?:\.\d+)?)\s*-\s*([0-9]{1,2}(?:\.\d+)?)/;
const AP_SINGLE = /(?:\bf\/?|\b1:)\s*([0-9]{1,2}(?:\.\d+)?)/;

/** Extract focal length and max aperture from a model name like "RF 70-200mm F2.8 IS". */
export function parseLensSpecs(model: string): ParsedLensSpec {
	const s = ` ${model.toLowerCase()} `;
	const out: ParsedLensSpec = {};

	const flRange = s.match(FOCAL_RANGE);
	const flSingle = s.match(FOCAL_SINGLE);
	if (flRange) {
		out.flMin = Number(flRange[1]);
		out.flMax = Number(flRange[2]);
		out.isPrime = false;
	} else if (flSingle) {
		out.flMin = Number(flSingle[1]);
		out.flMax = Number(flSingle[1]);
		out.isPrime = true;
	}

	const apRange = s.match(AP_RANGE);
	const apSingle = s.match(AP_SINGLE);
	if (apRange) {
		out.apertureWide = Number(apRange[1]);
		out.apertureTele = Number(apRange[2]);
	} else if (apSingle) {
		out.apertureWide = Number(apSingle[1]);
	}

	return out;
}

/** Detect a lens mount from the model prefix (EF-S, EF, RF, RF-S), else return fallback. */
export function detectMount(model: string, fallback: string): string {
	const s = model.toLowerCase();
	if (/\bef-?s\b/.test(s) || s.startsWith('ef-s') || s.startsWith('efs')) return 'ef-s';
	if (/\bef\b/.test(s) || s.startsWith('ef ')) return 'ef';
	if (/\brf-?s\b/.test(s) || s.startsWith('rf-s')) return 'rf-s';
	if (/\brf\b/.test(s) || s.startsWith('rf ')) return 'rf';
	return fallback;
}

/** Lens mounts usable on a given body mount (including via adapter). */
export function compatibleMounts(bodyMount: string): string[] {
	const map: Record<string, string[]> = {
		rf: ['rf', 'rf-s', 'ef', 'ef-s'],
		'rf-s': ['rf-s', 'rf', 'ef', 'ef-s'],
		ef: ['ef', 'ef-s'],
		'ef-s': ['ef-s', 'ef'],
		e: ['e'],
		fe: ['fe', 'e'],
		z: ['z'],
		m43: ['m43'],
		'phone-fixed': ['phone-fixed']
	};
	return map[bodyMount] ?? [bodyMount];
}

/** Human name for the adapter needed to mount a lens on a body, or null if none/unknown. */
export function adapterName(bodyMount: string, lensMount: string): string | null {
	if (lensMount === bodyMount) return null;
	if (
		(bodyMount === 'rf' || bodyMount === 'rf-s') &&
		(lensMount === 'ef' || lensMount === 'ef-s')
	) {
		return 'EF-EOS R adapter';
	}
	return null;
}

export function needsAdapter(bodyMount: string, lensMount: string): boolean {
	return adapterName(bodyMount, lensMount) !== null;
}
