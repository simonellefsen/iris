import { browser } from '$app/environment';
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

const STORAGE_KEY = 'iris-active-session';

class SessionStore {
	phase = $state<SessionPhase>('idle');
	context = $state<SessionContext | null>(null);
	task = $state<Task | null>(null);
	submission = $state<Submission | null>(null);
	evaluation = $state<Evaluation | null>(null);
	error = $state<string | null>(null);

	/** Set once restore() has run, so save() never clears storage before the first read. */
	private restored = false;

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
		if (browser) localStorage.removeItem(STORAGE_KEY);
	}

	/**
	 * Persist the active task/result to localStorage so the session survives a reload
	 * or app reopen. Errors (which are transient) are not saved; in-flight phases are
	 * stored as 'task' so a reload lands on the brief, not a stuck spinner.
	 * Uses $state.snapshot — IndexedDB/JSON can't clone Svelte's reactive proxies.
	 */
	save() {
		if (!browser || !this.restored) return;
		try {
			if (this.phase === 'idle' || this.phase === 'gathering' || !this.task) {
				localStorage.removeItem(STORAGE_KEY);
				return;
			}
			const snapshot = {
				phase: this.phase === 'done' ? 'done' : 'task',
				context: $state.snapshot(this.context),
				task: $state.snapshot(this.task),
				submission: $state.snapshot(this.submission),
				evaluation: $state.snapshot(this.evaluation)
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch {
			// best-effort: ignore quota / serialization failures
		}
	}

	/** Rehydrate the last active session from localStorage. Idempotent and safe. */
	restore() {
		this.restored = true;
		if (!browser) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const d = JSON.parse(raw);
			if (!d?.task) return;
			this.phase = d.phase === 'done' ? 'done' : 'task';
			this.context = d.context ?? null;
			this.task = d.task ?? null;
			this.submission = d.submission ?? null;
			this.evaluation = d.evaluation ?? null;
		} catch {
			// corrupt payload — start fresh
		}
	}
}

export const session = new SessionStore();
