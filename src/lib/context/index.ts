import type { LocationContext, NearbyPlace, SessionContext, WeatherContext } from '$lib/types/context';
import { reverseGeocode } from './geocode';
import { getNearbyPlaces } from './places';
import { getPosition } from './location';
import { getLight } from './sunphase';
import { getWeather, unknownWeather } from './weather';

export * from './location';
export * from './sunphase';
export * from './weather';
export * from './geocode';
export * from './places';

/**
 * Gather the full session context (location + weather + light). Location is required;
 * weather, geocoding, and nearby-places degrade gracefully if the network is unavailable.
 */
export async function gatherContext(date = new Date()): Promise<SessionContext> {
	const coords = await getPosition();
	const [geo, weather, nearby] = await Promise.all([
		reverseGeocode(coords.lat, coords.lon).catch(
			(): { name?: string; country?: string; street?: string; neighbourhood?: string } => ({})
		),
		getWeather(coords.lat, coords.lon).catch(() => undefined),
		getNearbyPlaces(coords.lat, coords.lon).catch(() => [] as NearbyPlace[])
	]);
	const light = getLight(date, coords.lat, coords.lon);

	const location: LocationContext = {
		lat: coords.lat,
		lon: coords.lon,
		accuracyM: coords.accuracyM,
		name: geo.name,
		country: geo.country,
		street: geo.street,
		neighbourhood: geo.neighbourhood,
		nearby
	};
	const w: WeatherContext = weather ?? unknownWeather();

	return { location, weather: w, light };
}
