import type { WeatherContext } from '$lib/types/context';

/** Map a WMO weather code (Open-Meteo `weather_code`) to a short text description. */
export function weatherCodeToText(code: number | undefined | null): string {
	if (code == null) return 'Unknown';
	const map: Record<number, string> = {
		0: 'Clear',
		1: 'Mainly clear',
		2: 'Partly cloudy',
		3: 'Overcast',
		45: 'Fog',
		48: 'Rime fog',
		51: 'Light drizzle',
		53: 'Drizzle',
		55: 'Heavy drizzle',
		56: 'Freezing drizzle',
		57: 'Freezing drizzle',
		61: 'Light rain',
		63: 'Rain',
		65: 'Heavy rain',
		66: 'Freezing rain',
		67: 'Freezing rain',
		71: 'Light snow',
		73: 'Snow',
		75: 'Heavy snow',
		77: 'Snow grains',
		80: 'Light showers',
		81: 'Showers',
		82: 'Violent showers',
		85: 'Snow showers',
		86: 'Snow showers',
		95: 'Thunderstorm',
		96: 'Thunderstorm + hail',
		99: 'Thunderstorm + hail'
	};
	return map[code] ?? 'Unknown';
}

const DEBUG_FIXTURES: Record<string, WeatherContext> = {
	clear: { tempC: 18, cloudCoverPct: 10, precipitationMm: 0, windKph: 8, uvIndex: 4, conditions: 'Clear' },
	overcast: { tempC: 12, cloudCoverPct: 95, precipitationMm: 0, windKph: 15, uvIndex: 2, conditions: 'Overcast' },
	rain: { tempC: 9, cloudCoverPct: 90, precipitationMm: 2.4, windKph: 22, uvIndex: 1, conditions: 'Rain' },
	night: { tempC: 6, cloudCoverPct: 5, precipitationMm: 0, windKph: 4, uvIndex: 0, conditions: 'Clear' }
};

export function unknownWeather(): WeatherContext {
	return { tempC: 0, cloudCoverPct: 0, precipitationMm: 0, windKph: 0, uvIndex: 0, conditions: 'Unknown' };
}

/** Fetch current weather from Open-Meteo (free, keyless, CORS-friendly). */
export async function getWeather(lat: number, lon: number): Promise<WeatherContext> {
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
		conditions: weatherCodeToText(c.weather_code)
	};
}
