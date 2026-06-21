<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { generateTask } from '$lib/pipelines/taskGeneration';
	import { evaluateSubmission } from '$lib/pipelines/evaluation';
	import { parseExif } from '$lib/media/exif';
	import { downscaleToJpeg, makeThumbnailDataUrl } from '$lib/media/downscale';
	import { capturePhoto } from '$lib/media/capture';
	import { pickImageViaInput } from '$lib/media/filepick';
	import { putPhoto } from '$lib/db/photos';
	import { db } from '$lib/db/schema';
	import { allBodies, allLenses } from '$lib/gear/catalog';
	import { useLiveQuery } from '$lib/db/live.svelte';
	import { distanceMeters } from '$lib/context';
	import { errorMessage } from '$lib/utils/result';
	import { formatShutter } from '$lib/utils/focal';
	import { mapsUrl, linkifyDestination } from '$lib/utils/maps';
	import { uid } from '$lib/utils/id';
	import type { NearbyPlace } from '$lib/types/context';
	import type { CoachingSession } from '$lib/types/session';
	import type { Submission } from '$lib/types/submission';
	import type { Task } from '$lib/types/task';

	const bodies = useLiveQuery(() => allBodies());
	const lenses = useLiveQuery(() => allLenses());
	const activeBody = $derived(
		bodies.value?.find((b) => b.id === settings.current.activeRig?.bodyId)
	);
	const activeLens = $derived(
		lenses.value?.find((l) => l.id === settings.current.activeRig?.lensId)
	);
	const hasKey = $derived(!!settings.active.apiKey);
	const hasRig = $derived(!!settings.current.activeRig);

	// Which nearby place the current task is focused on, and whether we're re-rolling for it.
	let selectedPlaceName = $state<string | null>(null);
	let rerolling = $state(false);

	function constraintList(task: Task): string[] {
		const c = task.constraints;
		const items: string[] = [];
		if (c.focalLengthTarget != null) {
			items.push(
				typeof c.focalLengthTarget === 'number'
					? `Focal length ≈ ${c.focalLengthTarget}mm`
					: `Focal length ${c.focalLengthTarget.min}–${c.focalLengthTarget.max}mm`
			);
		}
		if (c.apertureTarget != null) items.push(`Aperture f/${c.apertureTarget} or wider`);
		if (c.isoMax != null) items.push(`ISO ≤ ${c.isoMax}`);
		if (c.minShutterForHandheld) items.push(`Handhold at ≈ ${c.minShutterForHandheld} or faster`);
		if (c.motionType) items.push(`Motion: ${c.motionType}`);
		items.push(`Composition: ${c.compositionalRule}`);
		return items;
	}

	function scoreColor(score: number): string {
		return score >= 75 ? 'var(--good)' : score >= 50 ? 'var(--warn)' : 'var(--bad)';
	}

	async function start() {
		if (!hasRig) {
			session.error = 'Select a camera in Gear first.';
			return;
		}
		if (!hasKey) {
			session.error = 'Add an API key in Setup first.';
			return;
		}
		session.reset();
		selectedPlaceName = null;
		session.phase = 'gathering';
		const res = await generateTask(settings.current.activeRig!);
		if (!res.ok) {
			session.error = res.error;
			session.phase = 'idle';
			return;
		}
		session.task = res.value;
		session.context = res.value.context;
		session.phase = 'task';
	}

	// Re-design the task around a nearby place the user tapped, reusing the gathered context.
	async function focusOn(place: NearbyPlace) {
		if (!settings.current.activeRig || !session.context || rerolling) return;
		selectedPlaceName = place.name;
		rerolling = true;
		session.error = null;
		const res = await generateTask(settings.current.activeRig, {
			context: session.context,
			focusPlace: place
		});
		rerolling = false;
		if (!res.ok) {
			session.error = res.error;
			return;
		}
		session.task = res.value;
	}

	async function submit(source: 'capture' | 'pick') {
		if (!session.task) return;
		const outcome = source === 'capture' ? await capturePhoto() : await pickImageViaInput();
		if (outcome.error) {
			session.error = outcome.error;
			return;
		}
		if (!outcome.file) return; // cancelled
		session.phase = 'submitting';
		session.error = null;
		try {
			const file = outcome.file;
			const exif = await parseExif(file);
			const photo = await downscaleToJpeg(file);
			const thumbnail = await makeThumbnailDataUrl(file);
			const photoKey = await putPhoto(photo.blob);
			const submissionId = uid('sub');
			const geoMismatchMeters =
				exif.gps && session.context
					? Math.round(distanceMeters(exif.gps, session.context.location))
					: undefined;
			const submission: Submission = {
				id: submissionId,
				taskId: session.task.id,
				createdAt: Date.now(),
				photoBlobKey: photoKey,
				thumbnailDataUrl: thumbnail,
				exif,
				source: source === 'capture' ? 'phone-capture' : 'file-upload',
				geoMismatchMeters
			};
			await db().submissions.put(submission);
			session.submission = submission;
			session.phase = 'evaluating';
			const res = await evaluateSubmission({
				task: session.task,
				photo,
				exif,
				submissionId
			});
			if (!res.ok) {
				session.error = res.error;
				session.phase = 'task';
				return;
			}
			await db().evaluations.put(res.value);
			await db().tasks.put(session.task);
			const coaching: CoachingSession = {
				id: uid('sess'),
				startedAt: session.task.createdAt,
				endedAt: Date.now(),
				rig: session.task.rig,
				context: session.task.context,
				taskId: session.task.id,
				submissionId: submission.id,
				evaluationId: res.value.id
			};
			await db().sessions.put(coaching);
			session.evaluation = res.value;
			session.phase = 'done';
		} catch (e) {
			session.error = errorMessage(e);
			session.phase = 'task';
		}
	}
</script>

<h1 style="margin-bottom: 12px;">📷 Session</h1>

{#if session.error}
	<div class="error" style="margin-bottom: 12px;">{session.error}</div>
{/if}

{#if session.phase === 'idle'}
	<div class="card">
		<h3>Shooting with</h3>
		{#if activeBody}
			<p>
				<strong>{activeBody.make} {activeBody.model}</strong><br />
				{#if activeLens}<span class="muted">{activeLens.make} {activeLens.model}</span>{/if}
			</p>
		{:else}
			<p class="muted">No camera selected.</p>
		{/if}
		{#if !hasKey}
			<div class="note">Add an API key in <a href="/settings">Setup</a> to begin.</div>
		{/if}
		<button class="btn btn-primary btn-block" onclick={start} disabled={!hasRig || !hasKey}>
			Generate a task for right now
		</button>
	</div>
{:else if session.phase === 'gathering'}
	<div class="card row">
		<span class="spinner"></span>
		<span>Reading your location, light, and weather…</span>
	</div>
{:else if session.task}
	<!-- Context card -->
	{#if session.context}
		<div class="card">
			<div class="row">
				<strong>{session.context.light.label}</strong>
				<div class="spacer"></div>
				<span class="badge">{session.context.weather.conditions}</span>
			</div>
			<p class="muted" style="margin: 4px 0;">
				{[
					session.context.location.street,
					session.context.location.neighbourhood,
					session.context.location.name,
					session.context.location.country
				].filter(Boolean).join(', ') || 'Unknown location'}
			</p>
			<div class="muted" style="font-size: 0.85rem;">
				{session.context.weather.tempC}°C · {session.context.weather.cloudCoverPct}% cloud ·
				{session.context.weather.windKph} km/h wind
			</div>
			{#if (session.context.location.nearby ?? []).length}
				<div style="margin-top: 10px;">
					<div class="muted" style="font-size: 0.75rem; margin-bottom: 6px;">
						Tap a place to design the task around it:
					</div>
					<div class="chips">
						{#each (session.context.location.nearby ?? []).slice(0, 8) as place (place.name)}
							<button
								class="chip"
								class:active={selectedPlaceName === place.name}
								disabled={rerolling || session.busy}
								onclick={() => focusOn(place)}
							>{place.name}</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if session.phase === 'submitting' || session.phase === 'evaluating'}
		<div class="card row">
			<span class="spinner"></span>
			<span>{session.phase === 'submitting' ? 'Preparing your photo…' : 'Critiquing your photo…'}</span>
		</div>
	{:else if rerolling}
		<div class="card row">
			<span class="spinner"></span>
			<span>Designing a task around {selectedPlaceName}…</span>
		</div>
	{:else}
		{@const dest = session.task.destination}
		{@const loc = session.task.context.location}
		<!-- Task card -->
		<div class="card">
			<div class="chips" style="margin-bottom: 10px;">
				<span class="chip chip-diff {session.task.difficulty}">{session.task.difficulty}</span>
				{#each session.task.techniqueTags as tag}
					<span class="chip chip-tag">{tag}</span>
				{/each}
			</div>

			<h2 style="margin-bottom: 6px;">
				{#if dest}
					{@const parts = linkifyDestination(session.task.objective, dest.name)}
					{#if parts}{parts.before}<a
							class="dest-link"
							href={mapsUrl(dest, loc)}
							target="_blank"
							rel="noopener">{parts.match}</a>{parts.after}{:else}{session.task.objective}{/if}
				{:else}
					{session.task.objective}
				{/if}
			</h2>
			{#if dest}
				<a class="maps-link" href={mapsUrl(dest, loc)} target="_blank" rel="noopener">
					🗺️ Open {dest.name} in Maps
				</a>
			{/if}

			<h3>Brief</h3>
			<ul style="margin: 0; padding-left: 18px;">
				{#each constraintList(session.task) as item}
					<li>{item}</li>
				{/each}
			</ul>

			<h3>Suggested start</h3>
			<div class="row" style="flex-wrap: wrap;">
				<span class="pill">f/{session.task.suggestedExposure.aperture}</span>
				<span class="pill">{session.task.suggestedExposure.shutter}</span>
				<span class="pill">ISO {session.task.suggestedExposure.iso}</span>
			</div>
			{#if session.task.suggestedExposure.note}
				<p class="muted" style="font-size: 0.85rem;">{session.task.suggestedExposure.note}</p>
			{/if}

			{#if session.task.successCriteria.length}
				<h3>Success criteria</h3>
				<ul style="margin: 0; padding-left: 18px;">
					{#each session.task.successCriteria as s}
						<li>{s}</li>
					{/each}
				</ul>
			{/if}

			{#if session.task.coachingHints.length}
				<h3>Coaching tips</h3>
				<ul style="margin: 0; padding-left: 18px; color: var(--muted);">
					{#each session.task.coachingHints as h}
						<li>{h}</li>
					{/each}
				</ul>
			{/if}

			<div style="margin-top: 14px;">
				<button class="btn btn-primary btn-block" onclick={() => submit('capture')}>
					📸 Capture / submit
				</button>
				<button class="btn btn-ghost btn-block" style="margin-top: 8px;" onclick={() => submit('pick')}>
					⬆️ Upload from camera roll
				</button>
				<button class="btn btn-ghost btn-block" style="margin-top: 8px;" onclick={start}>
					↻ New task
				</button>
			</div>
		</div>
	{/if}
{/if}

{#if session.phase === 'done' && session.evaluation && session.submission}
	{@const ev = session.evaluation}
	<div class="card">
		<div class="score-ring">
			<div>
				<div class="score-num" style="color: {scoreColor(ev.overallScore)};">{ev.overallScore}</div>
				<div class="muted" style="font-size: 0.75rem;">out of 100</div>
			</div>
			<div style="flex: 1;">
				{#each ev.dimensions as d (d.name)}
					<div style="margin-bottom: 8px;">
						<div class="row" style="font-size: 0.82rem;">
							<span>{d.name}</span>
							<div class="spacer"></div>
							<span class="muted">{d.score}/10</span>
						</div>
						<div class="bar"><span style="width: {d.score * 10}%"></span></div>
					</div>
				{/each}
			</div>
		</div>
		<p style="margin-top: 10px;">{ev.summary}</p>
	</div>

	{#if ev.constraintViolations.length}
		<div class="error">{#each ev.constraintViolations as v}<div>• {v}</div>{/each}</div>
	{/if}

	{#if ev.strengths.length}
		<div class="card">
			<h3>Strengths</h3>
			<ul style="margin: 0; padding-left: 18px;">
				{#each ev.strengths as s}<li>{s}</li>{/each}
			</ul>
		</div>
	{/if}
	{#if ev.improvements.length}
		<div class="card">
			<h3>Try next time</h3>
			<ul style="margin: 0; padding-left: 18px;">
				{#each ev.improvements as s}<li>{s}</li>{/each}
			</ul>
		</div>
	{/if}

	<div class="card">
		<h3>Detected from your photo</h3>
		<div class="muted" style="font-size: 0.88rem;">
			{#if session.submission.exif.make}{session.submission.exif.make} {session.submission.exif.model}{/if}<br />
			{#if session.submission.exif.lensModel}Lens: {session.submission.exif.lensModel}<br />{/if}
			{#if session.submission.exif.focalLengthMm}{session.submission.exif.focalLengthMm}mm{/if}
			{#if session.submission.exif.aperture} · f/{session.submission.exif.aperture}{/if}
			{#if session.submission.exif.exposureTimeSec} · {formatShutter(session.submission.exif.exposureTimeSec)}{/if}
			{#if session.submission.exif.iso} · ISO {session.submission.exif.iso}{/if}
		</div>
		{#if session.submission.geoMismatchMeters != null && session.submission.geoMismatchMeters > 1000}
			<div class="note" style="margin-top: 8px;">
				Photo's GPS is {session.submission.geoMismatchMeters.toLocaleString()} m from your session location.
			</div>
		{/if}
	</div>

	<button class="btn btn-primary btn-block" onclick={start}>New task</button>
	<a class="btn btn-ghost btn-block" href="/history" style="margin-top: 8px;">View history</a>
{/if}
