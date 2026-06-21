import type { Evaluation } from '$lib/types/evaluation';
import type { SessionContext } from '$lib/types/context';
import type { Submission } from '$lib/types/submission';
import type { Task } from '$lib/types/task';

export type SessionPhase =
	| 'idle'
	| 'gathering'
	| 'task'
	| 'submitting'
	| 'evaluating'
	| 'done';

class SessionStore {
	phase = $state<SessionPhase>('idle');
	context = $state<SessionContext | null>(null);
	task = $state<Task | null>(null);
	submission = $state<Submission | null>(null);
	evaluation = $state<Evaluation | null>(null);
	error = $state<string | null>(null);

	get busy() {
		return (
			this.phase === 'gathering' ||
			this.phase === 'submitting' ||
			this.phase === 'evaluating'
		);
	}

	reset() {
		this.phase = 'idle';
		this.context = null;
		this.task = null;
		this.submission = null;
		this.evaluation = null;
		this.error = null;
	}
}

export const session = new SessionStore();
