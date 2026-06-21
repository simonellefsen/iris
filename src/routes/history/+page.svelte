<script lang="ts">
	import { db } from '$lib/db/schema';
	import { useLiveQuery } from '$lib/db/live.svelte';
	import type { Evaluation } from '$lib/types/evaluation';
	import type { Submission } from '$lib/types/submission';
	import type { Task } from '$lib/types/task';
	import type { CoachingSession } from '$lib/types/session';

	interface HistoryRow {
		session: CoachingSession;
		task?: Task;
		evaluation?: Evaluation;
		submission?: Submission;
	}

	const rows = useLiveQuery(async (): Promise<HistoryRow[]> => {
		const sessions = await db().sessions.orderBy('startedAt').reverse().toArray();
		return Promise.all(
			sessions.map(async (session) => ({
				session,
				task: await db().tasks.get(session.taskId),
				evaluation: session.evaluationId
					? await db().evaluations.get(session.evaluationId)
					: undefined,
				submission: session.submissionId
					? await db().submissions.get(session.submissionId)
					: undefined
			}))
		);
	});

	function scoreColor(score: number): string {
		return score >= 75 ? 'var(--good)' : score >= 50 ? 'var(--warn)' : 'var(--bad)';
	}
	function formatDate(ts: number): string {
		return new Date(ts).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<h1 style="margin-bottom: 12px;">📜 History</h1>

{#if rows.loading}
	<p class="muted">Loading…</p>
{:else if (rows.value ?? []).length === 0}
	<div class="card">
		<p class="muted">No sessions yet. <a href="/session">Start one</a> to build your history.</p>
	</div>
{:else}
	{#each rows.value ?? [] as row (row.session.id)}
		<a href="/session" class="card row" style="text-decoration: none; color: inherit; align-items: flex-start;">
			{#if row.submission?.thumbnailDataUrl}
				<img
					src={row.submission.thumbnailDataUrl}
					alt="thumbnail"
					style="width: 64px; height: 64px; object-fit: cover; border-radius: 10px; flex-shrink: 0;"
				/>
			{:else}
				<div
					style="width: 64px; height: 64px; border-radius: 10px; background: var(--surface-2); flex-shrink: 0;"
				></div>
			{/if}
			<div style="flex: 1; min-width: 0;">
				<div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
					{row.task?.objective ?? 'Session'}
				</div>
				<div class="muted" style="font-size: 0.8rem;">{formatDate(row.session.startedAt)}</div>
				{#if row.evaluation}
					<div class="row" style="margin-top: 4px;">
						<span
							class="badge"
							style="color: {scoreColor(row.evaluation.overallScore)}; background: rgba(148,163,184,0.12);"
						>
							{row.evaluation.overallScore}/100
						</span>
						{#if row.task}<span class="muted" style="font-size: 0.78rem;">{row.task.difficulty}</span>{/if}
					</div>
				{:else}
					<span class="badge badge-warn">Not evaluated</span>
				{/if}
			</div>
		</a>
	{/each}
{/if}
