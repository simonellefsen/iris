import type { ChatMessage } from '$lib/llm/provider';
import { activeProvider } from '$lib/llm/registry';
import { zodToJsonSchema } from '$lib/llm/structured';
import type { DownscaledImage } from '$lib/media/downscale';
import { resolveRig, rigCapabilities } from '$lib/gear/capability';
import { getBody, getLens } from '$lib/gear/catalog';
import { settings } from '$lib/stores/settings.svelte';
import { localeMeta } from '$lib/i18n/locales';
import type { Evaluation } from '$lib/types/evaluation';
import type { ExifSnapshot } from '$lib/types/submission';
import type { Task } from '$lib/types/task';
import { errorMessage, err, ok, type Result } from '$lib/utils/result';
import { uid } from '$lib/utils/id';
import { evalSystemPrompt, buildEvalUserPrompt } from './prompts/evalSystem';
import { evaluationOutputSchema } from './schemas';

export interface EvaluateInput {
	task: Task;
	photo: DownscaledImage;
	exif: ExifSnapshot;
	submissionId: string;
}

function clamp(n: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, n));
}

/**
 * Send the photo + EXIF + task brief to a vision model and parse a structured rubric.
 * If overallScore is omitted, derive it from the mean of the dimension scores.
 */
export async function evaluateSubmission(input: EvaluateInput): Promise<Result<Evaluation, string>> {
	const provider = activeProvider();
	if (!provider.supportsVision) {
		return err(`The active provider (${provider.id}) does not support image input.`);
	}

	const { body, lens } = await resolveRig(input.task.rig, getBody, getLens);
	const cap = rigCapabilities(body, lens);
	const languageName = localeMeta(settings.current.locale).languageName;

	const messages: ChatMessage[] = [
		{ role: 'system', content: evalSystemPrompt(languageName) },
		{
			role: 'user',
			content: [
				{ type: 'text', text: buildEvalUserPrompt({ task: input.task, cap, exif: input.exif }) },
				{ type: 'image', mediaType: input.photo.mediaType, base64: input.photo.base64 }
			]
		}
	];
	const schema = zodToJsonSchema(evaluationOutputSchema);

	let output;
	try {
		const first = await provider.generateStructured({
			messages,
			schema,
			schemaName: 'photo_evaluation',
			vision: true,
			temperature: 0.3
		});
		const r = evaluationOutputSchema.safeParse(first.json);
		if (r.success) {
			output = r.data;
		} else {
			const retry = await provider.generateStructured({
				messages: [
					...messages,
					{
						role: 'user',
						content: `Your previous output failed schema validation: ${r.error.message}. Return valid JSON matching the schema.`
					}
				],
				schema,
				schemaName: 'photo_evaluation',
				vision: true,
				temperature: 0.2
			});
			const r2 = evaluationOutputSchema.safeParse(retry.json);
			if (!r2.success) return err(`The model's evaluation was invalid: ${r2.error.message}`);
			output = r2.data;
		}
	} catch (e) {
		return err(`Evaluation failed: ${errorMessage(e)}`);
	}

	const dims = output.dimensions;
	const overall =
		output.overallScore ??
		Math.round((dims.reduce((s, d) => s + d.score, 0) / dims.length / 10) * 100);

	const evaluation: Evaluation = {
		id: uid('eval'),
		submissionId: input.submissionId,
		createdAt: Date.now(),
		overallScore: clamp(Math.round(overall), 0, 100),
		dimensions: dims,
		summary: output.summary,
		strengths: output.strengths,
		improvements: output.improvements,
		constraintViolations: output.constraintViolations,
		modelUsed: settings.current.providers[settings.current.activeProvider].visionModel
	};

	return ok(evaluation);
}
