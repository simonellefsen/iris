// Gear: cameras, lenses, and what the user is shooting with right now.

export type SensorFormat =
	| 'full-frame'
	| 'aps-c'
	| 'm4/3'
	| '1-inch'
	| 'phone'
	| 'medium-format';

// Known mounts plus any arbitrary string (adapter/legacy mounts).
export type Mount = 'rf' | 'ef' | 'ef-s' | 'e' | 'fe' | 'z' | 'm43' | 'phone-fixed' | (string & {});

export type GearSource = 'catalog' | 'llm-augmented' | 'user';

export interface SensorSize {
	w: number;
	h: number;
}

export interface CameraBody {
	id: string;
	make: string; // "Canon"
	model: string; // "EOS R8"
	mount: Mount; // "rf"
	sensor: SensorFormat;
	sensorSizeMm: SensorSize; // 36x24 for full-frame
	cropFactor: number; // 1.0 full-frame, 1.6 Canon APS-C
	megapixels: number;
	hasIBIS: boolean; // in-body image stabilization
	maxShutter: string; // "1/16000"
	minIso: number;
	maxIso: number;
	isPhone: boolean;
	source: GearSource;
}

/** Max aperture available at a given focal length (variable-aperture zooms have several). */
export interface ApertureStep {
	focalLength: number;
	maxAperture: number; // f-number (lower = faster)
}

export interface Lens {
	id: string;
	make: string;
	model: string;
	mount: Mount;
	isPrime: boolean;
	// Unified range: a prime is { min: 50, max: 50 }.
	focalLengthMm: { min: number; max: number };
	maxAperture: ApertureStep[]; // sorted ascending by focalLength
	hasOIS: boolean; // optical stabilization
	filterThreadMm?: number;
	source: GearSource;
}

/** A body plus the lenses the user owns for its mount. */
export interface GearProfile {
	id: string;
	bodyId: string;
	lensIds: string[];
	createdAt: number;
}

/** The rig selected for the current session (body + one lens). */
export interface ActiveRig {
	bodyId: string;
	lensId: string; // '' when the body is a phone with a fixed lens
}
