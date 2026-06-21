import * as SunCalc from 'suncalc';
import type { LightContext, LightPhase } from '$lib/types/context';

const PHASE_LABEL: Record<LightPhase, string> = {
	day: 'Daylight',
	'golden-hour': 'Golden hour',
	'blue-hour': 'Blue hour',
	'civil-twilight': 'Civil twilight',
	'nautical-twilight': 'Nautical twilight',
	'astronomical-twilight': 'Astronomical twilight',
	night: 'Night'
};

/**
 * Classify sun elevation (degrees) into a photography-relevant phase.
 *   el >= 3            -> day
 *   -4 .. 3            -> golden-hour
 *   -6 .. -4           -> blue-hour
 *   -12 .. -6          -> civil-twilight
 *   -18 .. -12         -> nautical-twilight
 *   < -18              -> astronomical-twilight / night
 */
export function phaseFromElevation(elDeg: number): LightPhase {
	if (elDeg >= 3) return 'day';
	if (elDeg >= -4) return 'golden-hour';
	if (elDeg >= -6) return 'blue-hour';
	if (elDeg >= -12) return 'civil-twilight';
	if (elDeg >= -18) return 'nautical-twilight';
	return 'astronomical-twilight';
}

function elevationAt(date: Date, lat: number, lon: number): number {
	const pos = SunCalc.getPosition(date, lat, lon);
	return (pos.altitude * 180) / Math.PI;
}

/** Minutes until the phase changes (scans forward up to 12h); 0 if none found. */
function minutesToNextPhase(date: Date, lat: number, lon: number, current: LightPhase): number {
	const step = 60_000;
	for (let i = 1; i <= 720; i++) {
		const t = new Date(date.getTime() + i * step);
		if (phaseFromElevation(elevationAt(t, lat, lon)) !== current) return i;
	}
	return 0;
}

export function getLight(date: Date, lat: number, lon: number): LightContext {
	const el = elevationAt(date, lat, lon);
	const phase = phaseFromElevation(el);
	const minutesUntilChange = minutesToNextPhase(date, lat, lon, phase);
	const next =
		minutesUntilChange > 0
			? phaseFromElevation(
					elevationAt(new Date(date.getTime() + minutesUntilChange * 60_000), lat, lon)
				)
			: phase;
	const verb = isBetterLight(next, phase) ? 'starts' : 'ends';
	const label =
		minutesUntilChange > 0
			? `${PHASE_LABEL[phase]} — ${verb} in ${fmt(minutesUntilChange)}`
			: PHASE_LABEL[phase];
	return { phase, sunElevationDeg: Math.round(el * 10) / 10, minutesUntilChange, label };
}

function isBetterLight(a: LightPhase, b: LightPhase): boolean {
	const rank: LightPhase[] = [
		'astronomical-twilight',
		'nautical-twilight',
		'civil-twilight',
		'blue-hour',
		'night',
		'day',
		'golden-hour'
	];
	return rank.indexOf(a) > rank.indexOf(b);
}

function fmt(min: number): string {
	if (min < 60) return `${min} min`;
	const h = Math.floor(min / 60);
	const m = min % 60;
	return m ? `${h}h ${m}m` : `${h}h`;
}

export function phaseLabel(phase: LightPhase): string {
	return PHASE_LABEL[phase];
}
