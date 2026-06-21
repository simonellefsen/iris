export interface RubricDimension {
	name: string; // "Composition", "Exposure", "Constraint Adherence"
	score: number; // 0-10
	rationale: string;
}

export interface Evaluation {
	id: string;
	submissionId: string;
	createdAt: number;
	overallScore: number; // 0-100
	dimensions: RubricDimension[];
	summary: string;
	strengths: string[];
	improvements: string[];
	constraintViolations: string[]; // e.g. "Shot at f/8 but the task asked for a wide aperture"
	modelUsed: string;
}
