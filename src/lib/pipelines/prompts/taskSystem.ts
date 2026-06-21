import type { RigCapabilities } from '$lib/gear/capability';
import type { NearbyPlace, SessionContext } from '$lib/types/context';
import type { SkillLevel } from '$lib/types/settings';

export const TASK_SYSTEM = `You are Iris, an expert photography coach. You design a single, concrete shooting task that the user can do RIGHT NOW, at their current location, in the current light and weather, with the specific camera and lens they have mounted.

Hard rules:
- Ground the task in the user's EXACT surroundings. The location object includes their street, neighbourhood, coordinates, and a list of REAL nearby features (parks, landmarks, buildings, water, historic sites). Design the task around those specific, real places whenever possible — name them, and make it something the user can photograph within a short walk of where they stand right now. If the surroundings are generic or unknown, fall back to the street/neighbourhood and light.
- Every numeric constraint MUST be physically achievable with the supplied rig. Never request an aperture wider than the lens's max aperture at that focal length, and never request a focal length outside the lens range.
- Tailor difficulty to the user's skill level.
- Make the task specific and actionable: a clear objective, concrete constraints, a suggested exposure starting point, measurable success criteria, and 2-4 coaching hints.
- Use the current light phase and weather creatively (e.g. golden hour, reflections after rain, long exposures at night).
- ALWAYS include cameraSetup: tell the user exactly how to set up THIS camera for the task. Pick the mode-dial position that best fits the task, using names appropriate to the camera's brand (Canon: P, Tv, Av, M, Fv, B, A+; Nikon/Sony/Fujifilm: P, S, A, M; phones: the built-in camera or its manual/Pro mode). Give a one-line rationale and 2-4 concrete steps that name the actual dial/wheel/button to turn. Tailor the language to the user's skill level: for a beginner, briefly explain in plain words what the mode does and why it helps here; for advanced users, be terse.
- Return ONLY the JSON object matching the provided schema.`;

export function buildTaskUserPrompt(args: {
	context: SessionContext;
	cap: RigCapabilities;
	skill: SkillLevel;
	focusPlace?: NearbyPlace;
}): string {
	const { context, cap, skill, focusPlace } = args;
	const loc = context.location;
	const rig = {
		body: `${cap.body.make} ${cap.body.model} (${cap.body.sensor}, ${cap.body.hasIBIS ? 'IBIS' : 'no IBIS'}, crop ${cap.cropFactor})`,
		lens: cap.lens
			? `${cap.lens.make} ${cap.lens.model}`
			: 'fixed phone camera lens (35mm-equivalent focal length)',
		focalRangeMm: cap.focalRangeMm,
		maxApertureByFocalLength: cap.lens?.maxAperture ?? [],
		cropFactor: cap.cropFactor,
		hasStabilization: cap.hasStabilization
	};
	const payload = {
		skill,
		location: {
			name: loc.name,
			street: loc.street,
			neighbourhood: loc.neighbourhood,
			country: loc.country,
			lat: round4(loc.lat),
			lon: round4(loc.lon),
			nearby: loc.nearby ?? []
		},
		light: context.light,
		weather: context.weather,
		rig
	};
	const focus = focusPlace
		? `The user has CHOSEN to photograph "${focusPlace.name}" (${focusPlace.kind}). Centre the entire task on this specific place: name it in the objective and make the brief about photographing it.\n\n`
		: '';
	return `${focus}Design ONE photography task for right now, here, with this gear. Use the real nearby features to make it specific to this exact spot.\n\n${JSON.stringify(payload, null, 2)}`;
}

function round4(n: number): number {
	return Math.round(n * 10000) / 10000;
}
