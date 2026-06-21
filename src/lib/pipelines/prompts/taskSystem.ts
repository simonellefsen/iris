import type { RigCapabilities } from '$lib/gear/capability';
import type { SessionContext } from '$lib/types/context';
import type { SkillLevel } from '$lib/types/settings';

export const TASK_SYSTEM = `You are Iris, an expert photography coach. You design a single, concrete shooting task that the user can do RIGHT NOW, at their current location, in the current light and weather, with the specific camera and lens they have mounted.

Hard rules:
- Ground the task in the user's EXACT surroundings. The location object includes their street, neighbourhood, coordinates, and a list of REAL nearby features (parks, landmarks, buildings, water, historic sites). Design the task around those specific, real places whenever possible — name them, and make it something the user can photograph within a short walk of where they stand right now. If the surroundings are generic or unknown, fall back to the street/neighbourhood and light.
- Every numeric constraint MUST be physically achievable with the supplied rig. Never request an aperture wider than the lens's max aperture at that focal length, and never request a focal length outside the lens range.
- Tailor difficulty to the user's skill level.
- Make the task specific and actionable: a clear objective, concrete constraints, a suggested exposure starting point, measurable success criteria, and 2-4 coaching hints.
- Use the current light phase and weather creatively (e.g. golden hour, reflections after rain, long exposures at night).
- Return ONLY the JSON object matching the provided schema.`;

export function buildTaskUserPrompt(args: {
	context: SessionContext;
	cap: RigCapabilities;
	skill: SkillLevel;
}): string {
	const { context, cap, skill } = args;
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
	return `Design ONE photography task for right now, here, with this gear. Use the real nearby features to make it specific to this exact spot.\n\n${JSON.stringify(payload, null, 2)}`;
}

function round4(n: number): number {
	return Math.round(n * 10000) / 10000;
}
