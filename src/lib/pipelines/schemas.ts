import { z } from 'zod';

/** Shape the LLM returns for task generation (client fills id/createdAt/context/rig). */
export const taskOutputSchema = z.object({
	objective: z.string().min(8),
	techniqueTags: z.array(z.string()),
	difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
	constraints: z.object({
		focalLengthTarget: z
			.union([z.number(), z.object({ min: z.number(), max: z.number() })])
			.optional(),
		apertureTarget: z.number().optional(),
		minShutterForHandheld: z.string().optional(),
		isoMax: z.number().optional(),
		motionType: z.enum(['freeze', 'pan', 'blur']).optional(),
		compositionalRule: z.string().min(4)
	}),
	suggestedExposure: z.object({
		aperture: z.number(),
		shutter: z.string(),
		iso: z.number(),
		note: z.string().optional()
	}),
	successCriteria: z.array(z.string()).min(1),
	coachingHints: z.array(z.string())
});
export type TaskOutput = z.infer<typeof taskOutputSchema>;

/** Shape the LLM returns for evaluation (client fills id/createdAt/submissionId/modelUsed). */
export const evaluationOutputSchema = z.object({
	dimensions: z
		.array(
			z.object({
				name: z.string(),
				score: z.number().min(0).max(10),
				rationale: z.string()
			})
		)
		.min(1),
	overallScore: z.number().min(0).max(100).optional(),
	summary: z.string(),
	strengths: z.array(z.string()),
	improvements: z.array(z.string()),
	constraintViolations: z.array(z.string())
});
export type EvaluationOutput = z.infer<typeof evaluationOutputSchema>;
