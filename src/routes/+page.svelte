<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { allBodies, allLenses } from '$lib/gear/catalog';
	import { useLiveQuery } from '$lib/db/live.svelte';
	import { PROVIDERS } from '$lib/llm/providers';

	const bodies = useLiveQuery(() => allBodies());
	const lenses = useLiveQuery(() => allLenses());

	const activeBody = $derived(
		bodies.value?.find((b) => b.id === settings.current.activeRig?.bodyId)
	);
	const activeLens = $derived(
		lenses.value?.find((l) => l.id === settings.current.activeRig?.lensId)
	);
	const hasKey = $derived(!!settings.active.apiKey);
	const providerLabel = $derived(PROVIDERS[settings.current.activeProvider].label);
</script>

<div class="card hero">
	<h1>📷 Iris</h1>
	<p class="muted">
		Your location-aware photography coach. Tell Iris what you're shooting with, and it'll set a task
		perfect for the light and weather right now — then critique your shot.
	</p>
</div>

{#if !hasKey}
	<div class="note">
		First, add an LLM provider API key (e.g. OpenRouter) in <a href="/settings">Setup</a>. Iris calls
		the provider directly from your device — your key stays on this device.
	</div>
{:else}
	<div class="card">
		<h3>Ready to shoot</h3>
		<div class="row">
			<div>
				<strong>{activeBody ? `${activeBody.make} ${activeBody.model}` : 'No camera selected'}</strong>
				{#if activeLens}
					<div class="muted">{activeLens.make} {activeLens.model}</div>
				{/if}
			</div>
			<div class="spacer"></div>
			<span class="badge">{providerLabel}</span>
		</div>
		<a class="btn btn-primary btn-block" href="/session" style="margin-top: 12px;">Start session →</a>
		<a class="btn btn-ghost btn-block" href="/gear" style="margin-top: 8px;">Change gear</a>
	</div>
{/if}

<div class="card">
	<h3>How it works</h3>
	<ol style="margin: 0; padding-left: 18px; color: var(--muted);">
		<li>Pick your camera and lens in <a href="/gear">Gear</a>.</li>
		<li>Start a session — Iris reads your location, light, and weather.</li>
		<li>Shoot the task and upload the photo.</li>
		<li>Get a scored critique against the brief.</li>
	</ol>
</div>
