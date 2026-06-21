import type { ExifSnapshot } from '$lib/types/submission';
import type { Task } from '$lib/types/task';
import type { RigCapabilities } from '$lib/gear/capability';

export const EVAL_SYSTEM = `You are Iris, a strict but encouraging photography coach grading a single submitted photo against a specific brief.

Grade across exactly these four rubric dimensions (each 0-10):
- "Composition": framing, balance, leading lines, use of the rule of thirds / negative space, subject placement.
- "Exposure & Technical": correct exposure, focus, depth of field, sharpness, noise.
- "Constraint Adherence": how well the photo meets the task's objective, compositional rule, focal length, aperture, and motion constraints. Use the supplied EXIF to verify settings; list concrete constraintViolations when a constraint is missed (e.g. "Shot at f/8 but the task asked for a wide aperture").
- "Creativity": originality, mood, storytelling.

Provide an overallScore (0-100), a one-paragraph summary, strengths, improvements, and any constraintViolations. Be specific and honest. Return ONLY the JSON object matching the provided schema.`;

export function buildEvalUserPrompt(args: {
	task: Task;
	cap: RigCapabilities;
	exif: ExifSnapshot;
}): string {
	const { task, cap, exif } = args;
	const brief = {
		objective: task.objective,
		difficulty: task.difficulty,
		constraints: task.constraints,
		successCriteria: task.successCriteria,
		rig: {
			body: `${cap.body.make} ${cap.body.model}`,
			lens: cap.lens ? `${cap.lens.make} ${cap.lens.model}` : 'phone camera',
			focalRangeMm: cap.focalRangeMm,
			maxApertureByFocalLength: cap.lens?.maxAperture ?? []
		},
		exif
	};
	return `Grade this photo against the brief below. EXIF shows the settings actually used.\n\n${JSON.stringify(brief, null, 2)}`;
}
