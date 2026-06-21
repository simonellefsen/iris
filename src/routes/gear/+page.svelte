<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { allBodies, allLenses } from '$lib/gear/catalog';
	import { augmentLens } from '$lib/gear/augment';
	import { db } from '$lib/db/schema';
	import { useLiveQuery } from '$lib/db/live.svelte';
	import { formatAperture } from '$lib/utils/aperture';
	import { adapterName, compatibleMounts, detectMount, parseLensSpecs } from '$lib/utils/lensSpec';
	import { uid } from '$lib/utils/id';
	import type { CameraBody, GearSource, Lens } from '$lib/types/gear';

	const bodies = useLiveQuery(() => allBodies());
	const lenses = useLiveQuery(() => allLenses());

	const activeRig = $derived(settings.current.activeRig);
	const activeBody = $derived(bodies.value?.find((b) => b.id === activeRig?.bodyId));
	const compatibleLenses = $derived(
		activeBody
			? (lenses.value ?? []).filter((l) => compatibleMounts(activeBody.mount).includes(l.mount))
			: []
	);
	const activeLensObj = $derived(
		compatibleLenses.find((l) => l.id === activeRig?.lensId)
	);
	const activeAdapter = $derived(
		activeBody && activeLensObj ? adapterName(activeBody.mount, activeLensObj.mount) : null
	);

	function lensSummary(l: Lens): string {
		const fl =
			l.focalLengthMm.min === l.focalLengthMm.max
				? `${l.focalLengthMm.min}mm`
				: `${l.focalLengthMm.min}-${l.focalLengthMm.max}mm`;
		const aps = [...new Set(l.maxAperture.map((a) => formatAperture(a.maxAperture)))];
		return `${fl} · ${aps.join('–')}`;
	}

	function sourceTag(src: GearSource): string | null {
		if (src === 'user') return 'yours';
		if (src === 'llm-augmented') return 'AI-filled';
		return null;
	}

	async function selectBody(body: CameraBody) {
		const mounts = compatibleMounts(body.mount);
		const compatible = (lenses.value ?? []).filter((l) => mounts.includes(l.mount));
		await settings.save({ ...settings.current, activeRig: { bodyId: body.id, lensId: compatible[0]?.id ?? '' } });
	}

	async function selectLens(lens: Lens) {
		if (!activeRig) return;
		await settings.save({ ...settings.current, activeRig: { ...activeRig, lensId: lens.id } });
	}

	// ---- Add / remove lenses ----
	let showAdd = $state(false);
	let aiBusy = $state(false);
	let addError = $state<string | null>(null);
	let form = $state({
		make: '',
		model: '',
		isPrime: true,
		flMin: 50,
		flMax: 50,
		aperture: 1.8,
		hasOIS: false
	});

	function openAdd() {
		addError = null;
		showAdd = true;
	}

	function resetForm() {
		form = { make: '', model: '', isPrime: true, flMin: 50, flMax: 50, aperture: 1.8, hasOIS: false };
		addError = null;
	}

	async function addLens() {
		if (!form.make.trim() || !form.model.trim()) {
			addError = 'Enter a make and model.';
			return;
		}
		const flMin = Math.min(form.flMin, form.flMax);
		const flMax = Math.max(form.flMin, form.flMax);
		// Variable-aperture zooms (e.g. 24-105 f/4-7.1) get a separate tele aperture.
		const teleAp = parseLensSpecs(form.model).apertureTele ?? form.aperture;
		const lens: Lens = {
			id: uid('lens'),
			make: form.make.trim(),
			model: form.model.trim(),
			mount: detectMount(form.model, activeBody?.mount ?? 'rf'),
			isPrime: form.isPrime,
			focalLengthMm: { min: flMin, max: flMax },
			maxAperture: [
				{ focalLength: flMin, maxAperture: form.aperture },
				{ focalLength: flMax, maxAperture: flMax === flMin ? form.aperture : teleAp }
			],
			hasOIS: form.hasOIS,
			source: 'user'
		};
		try {
			await db().lenses.put(lens);
			const mounts = activeBody ? compatibleMounts(activeBody.mount) : [];
			if (activeRig && activeBody && mounts.includes(lens.mount)) {
				await settings.save({ ...settings.current, activeRig: { ...activeRig, lensId: lens.id } });
			}
		} catch (e) {
			addError = `Could not save lens: ${e instanceof Error ? e.message : String(e)}`;
			return;
		}
		resetForm();
		showAdd = false;
	}

	/** Auto-fill focal length and aperture from the typed model name when possible. */
	function deriveFromModel() {
		const p = parseLensSpecs(form.model);
		if (p.isPrime !== undefined) form.isPrime = p.isPrime;
		if (p.flMin !== undefined) form.flMin = p.flMin;
		if (p.flMax !== undefined) form.flMax = p.flMax;
		if (p.apertureWide !== undefined) form.aperture = p.apertureWide;
	}

	async function fillWithAI() {
		if (!form.make.trim() || !form.model.trim()) {
			addError = 'Enter a make and model first.';
			return;
		}
		if (!settings.active.apiKey) {
			addError = 'Add an API key in Setup to use AI lookup.';
			return;
		}
		aiBusy = true;
		addError = null;
		const res = await augmentLens(form.make.trim(), form.model.trim());
		aiBusy = false;
		if (!res.ok) {
			addError = `AI lookup failed: ${res.error}`;
			return;
		}
		const l = res.value;
		form.isPrime = l.isPrime;
		form.flMin = l.focalLengthMm.min;
		form.flMax = l.focalLengthMm.max;
		form.aperture = l.maxAperture[0]?.maxAperture ?? form.aperture;
		form.hasOIS = l.hasOIS;
	}

	async function removeLens(lens: Lens) {
		await db().lenses.delete(lens.id);
		if (activeRig?.lensId === lens.id && activeRig) {
			const next = (lenses.value ?? []).find((l) => l.mount === lens.mount && l.id !== lens.id);
			await settings.save({ ...settings.current, activeRig: { ...activeRig, lensId: next?.id ?? '' } });
		}
	}
</script>

<h1 style="margin-bottom: 12px;">🎚️ Gear</h1>

<h3>Camera body</h3>
{#if bodies.loading}
	<p class="muted">Loading…</p>
{:else}
	{#each bodies.value ?? [] as body (body.id)}
		<button
			class="btn btn-block"
			style="justify-content: flex-start; margin-bottom: 8px; text-align: left; {body.id ===
			activeRig?.bodyId
				? 'border: 2px solid var(--accent);'
				: ''}"
			onclick={() => selectBody(body)}
		>
			<div>
				<div><strong>{body.make} {body.model}</strong></div>
				<div class="muted" style="font-size: 0.82rem;">
					{body.sensor} · {body.megapixels}MP · {body.isPhone ? 'Phone' : body.mount.toUpperCase()} mount
				</div>
			</div>
		</button>
	{/each}
{/if}

{#if activeBody}
	<h3>
		Lenses · {activeBody.mount.toUpperCase()} mount
		{#if compatibleLenses.length === 0}<span class="muted">(none yet)</span>{/if}
	</h3>

	{#each compatibleLenses as lens (lens.id)}
		<div class="row" style="gap: 6px; margin-bottom: 8px;">
			<button
				class="btn"
				style="flex: 1; justify-content: flex-start; text-align: left; {lens.id ===
				activeRig?.lensId
					? 'border: 2px solid var(--accent);'
					: ''}"
				onclick={() => selectLens(lens)}
			>
				<div>
					<div>
						<strong>{lens.make} {lens.model}</strong>
						{#if sourceTag(lens.source)}<span class="badge" style="margin-left: 6px;">{sourceTag(lens.source)}</span>{/if}
						{#if adapterName(activeBody.mount, lens.mount)}<span class="badge badge-warn" style="margin-left: 6px;">adapter</span>{/if}
					</div>
					<div class="muted" style="font-size: 0.82rem;">{lensSummary(lens)}</div>
				</div>
			</button>
			<button class="btn btn-ghost" title="Remove lens" onclick={() => removeLens(lens)}>🗑</button>
		</div>
	{/each}

	{#if showAdd}
		<div class="card">
			<h3>Add a lens</h3>
			<label for="lmake">Make</label>
			<input id="lmake" placeholder="Canon" bind:value={form.make} />
			<label for="lmodel">Model</label>
			<input
				id="lmodel"
				placeholder="EF 70-200mm f/2.8L IS"
				bind:value={form.model}
				oninput={deriveFromModel}
			/>
			<p class="muted" style="font-size: 0.76rem; margin: 4px 0 0;">
				Focal length &amp; aperture are derived from the model name. EF/EF-S lenses mount via an
				EF-EOS R adapter on this body.
			</p>

			<label class="row" style="margin-top: 10px; align-items: center;">
				<input type="checkbox" bind:checked={form.isPrime} style="width: auto;" />
				Prime lens (uncheck for zoom)
			</label>

			<div class="row" style="gap: 8px;">
				<div style="flex: 1;">
					<label for="flmin">Focal min (mm)</label>
					<input id="flmin" type="number" bind:value={form.flMin} />
				</div>
				{#if !form.isPrime}
					<div style="flex: 1;">
						<label for="flmax">Focal max (mm)</label>
						<input id="flmax" type="number" bind:value={form.flMax} />
					</div>
				{/if}
			</div>

			<div class="row" style="gap: 8px;">
				<div style="flex: 1;">
					<label for="lap">Max aperture (f/)</label>
					<input id="lap" type="number" step="0.1" bind:value={form.aperture} />
				</div>
				<label class="row" style="margin-top: 22px; align-items: center; flex: 1;">
					<input type="checkbox" bind:checked={form.hasOIS} style="width: auto;" />
					Stabilized (OIS)
				</label>
			</div>

			{#if addError}
				<div class="error" style="margin-top: 10px;">{addError}</div>
			{/if}

			<div class="row" style="margin-top: 12px;">
				<button class="btn btn-ghost" onclick={fillWithAI} disabled={aiBusy}>
					{aiBusy ? 'Looking up…' : '✨ Fill specs with AI'}
				</button>
				<div class="spacer"></div>
				<button class="btn btn-ghost" onclick={() => (showAdd = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={addLens}>Add lens</button>
			</div>
			<p class="muted" style="font-size: 0.78rem; margin-top: 8px;">
				AI lookup uses your active LLM provider. You can also type the specs yourself and skip it.
			</p>
		</div>
	{:else}
		<button class="btn btn-block btn-ghost" onclick={openAdd}>＋ Add lens</button>
	{/if}

	<div class="card" style="margin-top: 12px;">
		<h3>Selected rig</h3>
		<p>
			<strong>{activeBody.make} {activeBody.model}</strong><br />
			{#if activeRig?.lensId}
				{#each compatibleLenses as lens}
					{#if lens.id === activeRig.lensId}
						<span class="muted">{lens.make} {lens.model} ({lensSummary(lens)})</span>
					{/if}
				{/each}
			{:else}
				<span class="muted">No lens selected</span>
			{/if}
		</p>
		{#if activeAdapter}
			<div class="note" style="margin-bottom: 10px;">
				This {activeLensObj?.mount.toUpperCase()} lens mounts via an {activeAdapter}.
			</div>
		{/if}
		<a class="btn btn-primary btn-block" href="/session">Shoot with this rig →</a>
	</div>
{/if}
