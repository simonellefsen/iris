import type { ExifSnapshot } from '$lib/types/submission';
import type { Task } from '$lib/types/task';
import type { RigCapabilities } from '$lib/gear/capability';

/**
 * System prompt for evaluation. `languageName` sets the output language for the
 * written feedback (summary, rationales, strengths, improvements, violations).
 * The dimension names stay fixed (Composition / Exposure & Technical / …) for
 * consistent scoring, regardless of language.
 */
export function evalSystemPrompt(languageName: string): string {
	return `You are Iris, a strict but encouraging photography coach grading a single submitted photo against a specific brief.

Write ALL free-text feedback (summary, dimension rationales, strengths, improvements, constraintViolations) in ${languageName}. Keep the four dimension names exactly as listed below (they are scoring keys). Keep f-numbers, shutter speeds, and technical settings untranslated.

Grade across exactly these four rubric dimensions (each 0-10):
- "Composition": framing, balance, leading lines, use of the rule of thirds / negative space, subject placement.
- "Exposure & Technical": correct exposure, focus, depth of field, sharpness, noise.
- "Constraint Adherence": how well the photo meets the task's objective, compositional rule, focal length, aperture, and motion constraints. Use the supplied EXIF to verify settings; list concrete constraintViolations when a constraint is missed (e.g. "Shot at f/8 but the task asked for a wide aperture").
- "Creativity": originality, mood, storytelling.

Provide an overallScore (0-100), a one-paragraph summary, strengths, improvements, and any constraintViolations. Be specific and honest. Return ONLY the JSON object matching the provided schema.`;
}

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
