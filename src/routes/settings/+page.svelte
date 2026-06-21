<script lang="ts">
	import { onMount } from 'svelte';
	import { defaultSettings, settings } from '$lib/stores/settings.svelte';
	import { PROVIDER_LIST, PROVIDERS } from '$lib/llm/providers';
	import { createProvider } from '$lib/llm/registry';
	import type { ProviderKey, Settings } from '$lib/types/settings';
	import type { ValidationResult } from '$lib/llm/provider';

	/** Deep, mutable, plain copy of `src` (structuredClone breaks on Svelte $state proxies). */
	function clone<T>(src: T): T {
		return JSON.parse(JSON.stringify(src)) as T;
	}

	let draft = $state<Settings | null>(null);
	let saving = $state(false);
	let loadError = $state<string | null>(null);
	const results = $state<Record<string, ValidationResult>>({});

	onMount(async () => {
		// Always resolve to a usable draft — never leave the page stuck on "Loading…".
		try {
			await settings.load();
			draft = clone(settings.current);
		} catch (e) {
			console.error('Settings load failed', e);
			loadError = e instanceof Error ? e.message : String(e);
			draft = clone(defaultSettings());
		}
	});

	const activeKey = $derived(draft?.activeProvider ?? 'openrouter');

	async function save() {
		if (!draft) return;
		saving = true;
		try {
			await settings.save(draft);
		} finally {
			saving = false;
		}
	}

	async function validate() {
		if (!draft) return;
		const key = activeKey;
		results[key] = { ok: false };
		results[key] = { ok: true }; // optimistically clear error while loading
		const provider = createProvider(key, draft.providers[key]);
		results[key] = await provider.validateKey();
	}
</script>

<h1 style="margin-bottom: 12px;">⚙️ Setup</h1>

<div class="note">
	Bring your own key: Iris calls your LLM provider directly from the browser. Your API key is stored
	only on this device (IndexedDB) and is sent only to the provider you choose.
</div>

{#if draft}
	<div class="card">
		<label for="provider">LLM provider</label>
		<select id="provider" bind:value={draft.activeProvider}>
			{#each PROVIDER_LIST as p (p.key)}
				<option value={p.key}>{p.label} {p.supportsVision ? '' : '(no vision)'}</option>
			{/each}
		</select>

		<label for="key">API key</label>
		<input
			id="key"
			type="password"
			placeholder="sk-… / your provider key"
			bind:value={draft.providers[activeKey].apiKey}
		/>
		<div class="row" style="margin-top: 8px;">
			<button class="btn btn-ghost" onclick={validate}>Test key</button>
			<a href={PROVIDERS[activeKey].helpURL} target="_blank" rel="noopener" class="muted" style="font-size: 0.85rem;">
				Get a {PROVIDERS[activeKey].label} key ↗
			</a>
			<div class="spacer"></div>
			{#if results[activeKey]}
				<span class="badge {results[activeKey].ok ? 'badge-good' : 'badge-bad'}">
					{results[activeKey].ok ? 'Valid' : 'Failed'}
				</span>
			{/if}
		</div>
		{#if results[activeKey] && !results[activeKey].ok && results[activeKey].error}
			<div class="error" style="margin-top: 8px;">{results[activeKey].error}</div>
		{/if}

		<label for="textmodel">Text model (task design)</label>
		<input id="textmodel" bind:value={draft.providers[activeKey].textModel} />

		<label for="visionmodel">Vision model (evaluation)</label>
		<input id="visionmodel" bind:value={draft.providers[activeKey].visionModel} />
		<p class="muted" style="font-size: 0.8rem;">
			Vision quality: {PROVIDERS[activeKey].visionQuality}. Edit the model ids to use newer releases.
		</p>
	</div>

	<div class="card">
		<label for="skill">Your skill level</label>
		<select id="skill" bind:value={draft.skillLevel}>
			<option value="beginner">Beginner</option>
			<option value="intermediate">Intermediate</option>
			<option value="advanced">Advanced</option>
		</select>
		<label class="row" style="margin-top: 12px; align-items: center;">
			<input
				type="checkbox"
				bind:checked={draft.llmAugmentGear}
				style="width: auto;"
			/>
			Let the LLM fill specs for gear not in the catalog
		</label>
	</div>

	<button class="btn btn-primary btn-block" onclick={save} disabled={saving}>
		{saving ? 'Saving…' : 'Save settings'}
	</button>
{:else if loadError}
	<div class="error">{loadError} — showing defaults.</div>
	<button class="btn btn-primary btn-block" onclick={() => settings.load()}>Retry</button>
{:else}
	<p class="muted">Loading…</p>
{/if}
