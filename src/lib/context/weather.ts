import type { WeatherContext } from '$lib/types/context';
import { weatherText } from '$lib/i18n/messages';
import type { UiKey } from '$lib/i18n/locales';

/** Map a WMO weather code (Open-Meteo `weather_code`) to a short localized description. */
export function weatherCodeToText(code: number | undefined | null, ui: UiKey = 'en'): string {
	return weatherText(code, ui);
}

const DEBUG_FIXTURES: Record<string, WeatherContext> = {
	clear: { tempC: 18, cloudCoverPct: 10, precipitationMm: 0, windKph: 8, uvIndex: 4, conditions: 'Clear' },
	overcast: { tempC: 12, cloudCoverPct: 95, precipitationMm: 0, windKph: 15, uvIndex: 2, conditions: 'Overcast' },
	rain: { tempC: 9, cloudCoverPct: 90, precipitationMm: 2.4, windKph: 22, uvIndex: 1, conditions: 'Rain' },
	night: { tempC: 6, cloudCoverPct: 5, precipitationMm: 0, windKph: 4, uvIndex: 0, conditions: 'Clear' }
};

export function unknownWeather(ui: UiKey = 'en'): WeatherContext {
	return {
		tempC: 0,
		cloudCoverPct: 0,
		precipitationMm: 0,
		windKph: 0,
		uvIndex: 0,
		conditions: weatherText(undefined, ui)
	};
}

/** Fetch current weather from Open-Meteo (free, keyless, CORS-friendly). */
export async function getWeather(lat: number, lon: number, ui: UiKey = 'en'): Promise<WeatherContext> {
	if (typeof window !== 'undefined') {
		const m = /(?:[?&]debugWeather=)([a-z]+)/i.exec(window.location.search);
		if (m && DEBUG_FIXTURES[m[1].toLowerCase()]) return DEBUG_FIXTURES[m[1].toLowerCase()];
	}
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(lat));
	url.searchParams.set('longitude', String(lon));
	url.searchParams.set(
		'current',
		'temperature_2m,cloud_cover,precipitation,wind_speed_10m,uv_index,weather_code'
	);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Weather request failed (HTTP ${res.status})`);
	const data = (await res.json()) as {
		current?: {
			temperature_2m?: number;
			cloud_cover?: number;
			precipitation?: number;
			wind_speed_10m?: number;
			uv_index?: number;
			weather_code?: number;
		};
	};
	const c = data.current ?? {};
	return {
		tempC: c.temperature_2m ?? 0,
		cloudCoverPct: c.cloud_cover ?? 0,
		precipitationMm: c.precipitation ?? 0,
		windKph: c.wind_speed_10m ?? 0,
		uvIndex: c.uv_index ?? 0,
		conditions: weatherCodeToText(c.weather_code, ui)
	};
}
