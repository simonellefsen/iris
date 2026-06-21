import type { LocationContext, SessionContext, WeatherContext } from '$lib/types/context';
import { reverseGeocode } from './geocode';
import { getPosition } from './location';
import { getLight } from './sunphase';
import { getWeather, unknownWeather } from './weather';

export * from './location';
export * from './sunphase';
export * from './weather';
export * from './geocode';

/**
 * Gather the full session context (location + weather + light). Location is required;
 * weather and geocoding degrade gracefully if the network is unavailable.
 */
export async function gatherContext(date = new Date()): Promise<SessionContext> {
	const coords = await getPosition();
	const [geo, weather] = await Promise.all([
		reverseGeocode(coords.lat, coords.lon).catch(
			(): { name?: string; country?: string } => ({})
		),
		getWeather(coords.lat, coords.lon).catch(() => undefined)
	]);
	const light = getLight(date, coords.lat, coords.lon);

	const location: LocationContext = {
		lat: coords.lat,
		lon: coords.lon,
		accuracyM: coords.accuracyM,
		name: geo.name,
		country: geo.country
	};
	const w: WeatherContext = weather ?? unknownWeather();

	return { location, weather: w, light };
}
