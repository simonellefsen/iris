import * as SunCalc from 'suncalc';
import type { LightContext, LightPhase } from '$lib/types/context';
import { lightLabel, lightPhaseLabel } from '$lib/i18n/messages';
import type { UiKey } from '$lib/i18n/locales';

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

export function getLight(date: Date, lat: number, lon: number, ui: UiKey = 'en'): LightContext {
	const el = elevationAt(date, lat, lon);
	const phase = phaseFromElevation(el);
	const minutesUntilChange = minutesToNextPhase(date, lat, lon, phase);
	const next =
		minutesUntilChange > 0
			? phaseFromElevation(
					elevationAt(new Date(date.getTime() + minutesUntilChange * 60_000), lat, lon)
				)
			: phase;
	const verb: 'starts' | 'ends' = isBetterLight(next, phase) ? 'starts' : 'ends';
	const label = lightLabel(phase, minutesUntilChange, verb, ui);
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

export function phaseLabel(phase: LightPhase, ui: UiKey = 'en'): string {
	return lightPhaseLabel(phase, ui);
}
