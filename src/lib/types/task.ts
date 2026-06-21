import type { ActiveRig } from './gear';
import type { SessionContext } from './context';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type MotionType = 'freeze' | 'pan' | 'blur';

export interface ExposureSuggestion {
	aperture: number; // f-number, e.g. 2.8
	shutter: string; // "1/250"
	iso: number;
	note?: string; // "handheld: keep >= 1/(focal-equivalent)"
}

export interface TaskConstraint {
	focalLengthTarget?: number | { min: number; max: number };
	apertureTarget?: number; // require shooting at <= this f-number
	minShutterForHandheld?: string;
	isoMax?: number;
	motionType?: MotionType;
	compositionalRule: string; // echoed back into the evaluation rubric
}

export interface Task {
	id: string;
	createdAt: number;
	objective: string; // "Capture leading lines converging on your subject"
	techniqueTags: string[]; // ["leading-lines", "shallow-dof", "golden-hour"]
	constraints: TaskConstraint;
	suggestedExposure: ExposureSuggestion;
	successCriteria: string[];
	coachingHints: string[];
	difficulty: Difficulty;
	context: SessionContext;
	rig: ActiveRig;
	/** A real place the task sends the user to, for an "open in maps" action. */
	destination?: TaskDestination;
}

export interface TaskDestination {
	name: string;
	lat?: number;
	lon?: number;
}
