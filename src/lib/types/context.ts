// Environmental context gathered at the start of a session.

export type LightPhase =
	| 'night'
	| 'astronomical-twilight'
	| 'nautical-twilight'
	| 'blue-hour'
	| 'civil-twilight'
	| 'golden-hour'
	| 'day';

export interface LightContext {
	phase: LightPhase;
	sunElevationDeg: number;
	minutesUntilChange: number; // until the next phase boundary
	label: string; // "Golden hour ends in 18 min"
}

export interface WeatherContext {
	tempC: number;
	cloudCoverPct: number;
	precipitationMm: number;
	windKph: number;
	conditions: string; // "Clear", "Overcast"...
	uvIndex: number;
}

export interface NearbyPlace {
	name: string;
	kind: string; // park | landmark | historic | water | nature | building | leisure | place
	lat?: number; // from OSM (node coords or way center) — used to open a precise map pin
	lon?: number;
}

export interface LocationContext {
	lat: number;
	lon: number;
	accuracyM: number;
	name?: string; // reverse-geocoded place (city/locality)
	country?: string;
	street?: string; // road / pedestrian street
	neighbourhood?: string; // suburb / neighbourhood / quarter
	nearby?: NearbyPlace[]; // real nearby parks, landmarks, buildings, water
}

export interface SessionContext {
	location: LocationContext;
	weather: WeatherContext;
	light: LightContext;
}
