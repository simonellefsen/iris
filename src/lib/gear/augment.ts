import { activeProvider } from '$lib/llm/registry';
import { zodToJsonSchema } from '$lib/llm/structured';
import type { ChatMessage } from '$lib/llm/provider';
import type { CameraBody, Lens, SensorFormat } from '$lib/types/gear';
import type { Result } from '$lib/utils/result';
import { err, ok } from '$lib/utils/result';
import { uid } from '$lib/utils/id';
import { z } from 'zod';

const apertureStepSchema = z.object({
	focalLength: z.number(),
	maxAperture: z.number()
});

const lensSpecSchema = z.object({
	make: z.string(),
	model: z.string(),
	mount: z.string(),
	isPrime: z.boolean(),
	focalLengthMin: z.number(),
	focalLengthMax: z.number(),
	maxApertureSteps: z.array(apertureStepSchema).min(1),
	hasOIS: z.boolean(),
	filterThreadMm: z.number().optional()
});

const bodySpecSchema = z.object({
	make: z.string(),
	model: z.string(),
	mount: z.string(),
	sensor: z.enum([
		'full-frame',
		'aps-c',
		'm4/3',
		'1-inch',
		'phone',
		'medium-format'
	]),
	cropFactor: z.number(),
	megapixels: z.number(),
	hasIBIS: z.boolean(),
	maxShutter: z.string(),
	minIso: z.number(),
	maxIso: z.number(),
	isPhone: z.boolean()
});

const LENS_SYSTEM =
	'You are an expert photography gear database. Return accurate, real-world specifications for the requested lens. ' +
	'For variable-aperture zooms, provide maxApertureSteps at the short and long ends (and any midpoint). ' +
	'mount is lowercase (rf, ef, e, fe, z, m43). If genuinely uncertain, give your best estimate.';

const BODY_SYSTEM =
	'You are an expert photography gear database. Return accurate, real-world specifications for the requested camera body. ' +
	'mount is lowercase (rf, ef, e, fe, z, m43, phone-fixed). isPhone is true only for smartphones.';

async function runStructured(
	system: string,
	prompt: string,
	schemaName: string,
	schema: object
): Promise<unknown> {
	const messages: ChatMessage[] = [
		{ role: 'system', content: system },
		{ role: 'user', content: prompt }
	];
	const { json } = await activeProvider().generateStructured({ messages, schema, schemaName });
	return json;
}

/** Ask the LLM to fill in specs for a lens not in the catalog. Result is marked llm-augmented. */
export async function augmentLens(make: string, model: string): Promise<Result<Lens, string>> {
	try {
		const json = await runStructured(
			LENS_SYSTEM,
			`Lens: ${make} ${model}. Return its specifications.`,
			'lens_specs',
			zodToJsonSchema(lensSpecSchema)
		);
		const p = lensSpecSchema.parse(json);
		const lens: Lens = {
			id: uid('lens'),
			make: p.make,
			model: p.model,
			mount: p.mount.toLowerCase(),
			isPrime: p.isPrime,
			focalLengthMm: { min: p.focalLengthMin, max: p.focalLengthMax },
			maxAperture: p.maxApertureSteps.map((s) => ({ focalLength: s.focalLength, maxAperture: s.maxAperture })),
			hasOIS: p.hasOIS,
			filterThreadMm: p.filterThreadMm,
			source: 'llm-augmented'
		};
		return ok(lens);
	} catch (e) {
		return err(e instanceof Error ? e.message : String(e));
	}
}

/** Ask the LLM to fill in specs for a camera body not in the catalog. Result is marked llm-augmented. */
export async function augmentBody(make: string, model: string): Promise<Result<CameraBody, string>> {
	try {
		const json = await runStructured(
			BODY_SYSTEM,
			`Camera body: ${make} ${model}. Return its specifications.`,
			'body_specs',
			zodToJsonSchema(bodySpecSchema)
		);
		const p = bodySpecSchema.parse(json);
		const body: CameraBody = {
			id: uid('body'),
			make: p.make,
			model: p.model,
			mount: p.mount.toLowerCase(),
			sensor: p.sensor as SensorFormat,
			sensorSizeMm: { w: 36, h: 24 },
			cropFactor: p.cropFactor,
			megapixels: p.megapixels,
			hasIBIS: p.hasIBIS,
			maxShutter: p.maxShutter,
			minIso: p.minIso,
			maxIso: p.maxIso,
			isPhone: p.isPhone,
			source: 'llm-augmented'
		};
		return ok(body);
	} catch (e) {
		return err(e instanceof Error ? e.message : String(e));
	}
}
