/** 35mm-equivalent focal length for a given actual focal length and crop factor. */
export function equivFocal(focalLengthMm: number, cropFactor: number): number {
	return focalLengthMm * cropFactor;
}

/**
 * Minimum safe handheld shutter speed (seconds) via the reciprocal-focal rule:
 * 1 / equivalent-focal-length, with stabilization buying ~3 stops (8x).
 */
export function minHandheldShutterSec(equivFocalMm: number, hasStabilization: boolean): number {
	const base = 1 / Math.max(equivFocalMm, 10);
	return hasStabilization ? base * Math.pow(2, 3) : base;
}

/** Format a shutter speed in seconds: 0.004 -> "1/250", 2 -> "2\"", 0.5 -> "1/2". */
export function formatShutter(sec: number): string {
	if (sec >= 1) return `${roundShutter(sec)}"`;
	if (sec >= 0.5) {
		// 0.5 -> 1/2
		const denom = Math.round(1 / sec);
		return `1/${denom}`;
	}
	const denom = Math.round(1 / sec);
	return `1/${denom}`;
}

function roundShutter(sec: number): number {
	// snap to common full-stop fractions when close
	return Math.round(sec * 10) / 10;
}

/** Parse "1/250" -> 0.004, "2\"" -> 2, "0.5" -> 0.5. */
export function parseShutterSec(s: string): number | undefined {
	const trimmed = s.trim();
	if (/^\d+\/\d+$/.test(trimmed)) {
		const [n, d] = trimmed.split('/').map(Number);
		return d ? n / d : undefined;
	}
	if (/^\d+(\.\d+)?"$/.test(trimmed)) return Number(trimmed.replace('"', ''));
	const n = Number(trimmed);
	return Number.isFinite(n) ? n : undefined;
}
