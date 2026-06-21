import type { ChatMessage } from '$lib/llm/provider';
import { activeProvider } from '$lib/llm/registry';
import { zodToJsonSchema } from '$lib/llm/structured';
import { gatherContext } from '$lib/context';
import { enforceFeasibility, resolveRig, rigCapabilities } from '$lib/gear/capability';
import { getBody, getLens } from '$lib/gear/catalog';
import { settings } from '$lib/stores/settings.svelte';
import { localeMeta, uiKeyFor } from '$lib/i18n/locales';
import type { NearbyPlace, SessionContext } from '$lib/types/context';
import type { ActiveRig } from '$lib/types/gear';
import type { Task, TaskDestination } from '$lib/types/task';
import { errorMessage, err, ok, type Result } from '$lib/utils/result';
import { findMentionedPlace } from '$lib/utils/maps';
import { uid } from '$lib/utils/id';
import { taskSystemPrompt, buildTaskUserPrompt } from './prompts/taskSystem';
import { taskOutputSchema } from './schemas';

export interface GenerateTaskOptions {
	/** Reuse already-gathered context (e.g. when re-rolling for a chosen place) instead of re-fetching. */
	context?: SessionContext;
	/** A nearby place the user explicitly chose — the task is centred on it. */
	focusPlace?: NearbyPlace;
}

/**
 * Gather context for here-and-now, then ask the LLM to design a single task that is
 * feasible with the mounted rig. The result is clamped by enforceFeasibility as insurance
 * against the model requesting impossible settings.
 */
export async function generateTask(
	rig: ActiveRig,
	opts: GenerateTaskOptions = {}
): Promise<Result<Task, string>> {
	const locale = settings.current.locale;
	const ui = uiKeyFor(locale);
	const languageName = localeMeta(locale).languageName;

	let context = opts.context;
	if (!context) {
		try {
			context = await gatherContext(new Date(), ui);
		} catch (e) {
			return err(`Could not determine your location: ${errorMessage(e)}`);
		}
	}

	let body;
	let lens;
	try {
		const resolved = await resolveRig(rig, getBody, getLens);
		body = resolved.body;
		lens = resolved.lens;
	} catch (e) {
		return err(errorMessage(e));
	}
	const cap = rigCapabilities(body, lens);

	const messages: ChatMessage[] = [
		{ role: 'system', content: taskSystemPrompt(languageName) },
		{
			role: 'user',
			content: buildTaskUserPrompt({
				context,
				cap,
				skill: settings.current.skillLevel,
				languageName,
				focusPlace: opts.focusPlace
			})
		}
	];
	const schema = zodToJsonSchema(taskOutputSchema);
	const provider = activeProvider();

	let output;
	try {
		const first = await provider.generateStructured({
			messages,
			schema,
			schemaName: 'photo_task',
			temperature: 0.8
		});
		const r = taskOutputSchema.safeParse(first.json);
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
				schemaName: 'photo_task',
				temperature: 0.4
			});
			const r2 = taskOutputSchema.safeParse(retry.json);
			if (!r2.success) return err(`The model's task output was invalid: ${r2.error.message}`);
			output = r2.data;
		}
	} catch (e) {
		return err(`Task generation failed: ${errorMessage(e)}`);
	}

	// Prefer the explicitly chosen place; otherwise detect one the model named in the objective.
	const destPlace = opts.focusPlace ?? findMentionedPlace(output.objective, context.location.nearby);
	const destination: TaskDestination | undefined = destPlace
		? { name: destPlace.name, lat: destPlace.lat, lon: destPlace.lon }
		: undefined;

	const task: Task = {
		id: uid('task'),
		createdAt: Date.now(),
		objective: output.objective,
		techniqueTags: output.techniqueTags,
		constraints: output.constraints,
		suggestedExposure: output.suggestedExposure,
		successCriteria: output.successCriteria,
		coachingHints: output.coachingHints,
		difficulty: output.difficulty,
		cameraSetup: output.cameraSetup,
		context,
		rig,
		destination
	};

	return ok(enforceFeasibility(task, cap));
}
