import type { ActiveRig } from './gear';
import type { SessionContext } from './context';

export interface CoachingSession {
	id: string;
	startedAt: number;
	endedAt?: number;
	rig: ActiveRig;
	context: SessionContext;
	taskId: string;
	submissionId?: string;
	evaluationId?: string;
}
