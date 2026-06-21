<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { allBodies, allLenses } from '$lib/gear/catalog';
	import { augmentLens } from '$lib/gear/augment';
	import { db } from '$lib/db/schema';
	import { useLiveQuery } from '$lib/db/live.svelte';
	import { formatAperture } from '$lib/utils/aperture';
	import { adapterName, compatibleMounts, detectMount, parseLensSpecs } from '$lib/utils/lensSpec';
	import { t } from '$lib/i18n';
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
		if (src === 'user') return t('gear.sourceYours');
		if (src === 'llm-augmented') return t('gear.sourceAi');
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
			addError = t('gear.errorNeedMakeModel');
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
			addError = t('gear.errorSaveLens', { msg: e instanceof Error ? e.message : String(e) });
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
			addError = t('gear.errorNeedMakeModelAi');
			return;
		}
		if (!settings.active.apiKey) {
			addError = t('gear.errorNeedKey');
			return;
		}
		aiBusy = true;
		addError = null;
		const res = await augmentLens(form.make.trim(), form.model.trim());
		aiBusy = false;
		if (!res.ok) {
			addError = t('gear.errorAiFailed', { msg: res.error });
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

<h1 style="margin-bottom: 12px;">{t('gear.title')}</h1>

<h3>{t('gear.cameraBody')}</h3>
{#if bodies.loading}
	<p class="muted">{t('common.loading')}</p>
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
					{body.sensor} · {body.megapixels}MP · {body.isPhone ? t('gear.phoneWord') : `${body.mount.toUpperCase()} ${t('gear.mountWord')}`}
				</div>
			</div>
		</button>
	{/each}
{/if}

{#if activeBody}
	<h3>
		{t('gear.lensesMount', { mount: activeBody.mount.toUpperCase() })}
		{#if compatibleLenses.length === 0}<span class="muted">{t('gear.noneYet')}</span>{/if}
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
						{#if adapterName(activeBody.mount, lens.mount)}<span class="badge badge-warn" style="margin-left: 6px;">{t('gear.adapter')}</span>{/if}
					</div>
					<div class="muted" style="font-size: 0.82rem;">{lensSummary(lens)}</div>
				</div>
			</button>
			<button class="btn btn-ghost" title={t('gear.removeLens')} onclick={() => removeLens(lens)}>🗑</button>
		</div>
	{/each}

	{#if showAdd}
		<div class="card">
			<h3>{t('gear.addLens')}</h3>
			<label for="lmake">{t('gear.make')}</label>
			<input id="lmake" placeholder={t('gear.makePlaceholder')} bind:value={form.make} />
			<label for="lmodel">{t('gear.model')}</label>
			<input
				id="lmodel"
				placeholder={t('gear.modelPlaceholder')}
				bind:value={form.model}
				oninput={deriveFromModel}
			/>
			<p class="muted" style="font-size: 0.76rem; margin: 4px 0 0;">
				{t('gear.deriveNote')}
			</p>

			<label class="row" style="margin-top: 10px; align-items: center;">
				<input type="checkbox" bind:checked={form.isPrime} style="width: auto;" />
				{t('gear.primeLabel')}
			</label>

			<div class="row" style="gap: 8px;">
				<div style="flex: 1;">
					<label for="flmin">{t('gear.focalMin')}</label>
					<input id="flmin" type="number" bind:value={form.flMin} />
				</div>
				{#if !form.isPrime}
					<div style="flex: 1;">
						<label for="flmax">{t('gear.focalMax')}</label>
						<input id="flmax" type="number" bind:value={form.flMax} />
					</div>
				{/if}
			</div>

			<div class="row" style="gap: 8px;">
				<div style="flex: 1;">
					<label for="lap">{t('gear.maxAperture')}</label>
					<input id="lap" type="number" step="0.1" bind:value={form.aperture} />
				</div>
				<label class="row" style="margin-top: 22px; align-items: center; flex: 1;">
					<input type="checkbox" bind:checked={form.hasOIS} style="width: auto;" />
					{t('gear.stabilized')}
				</label>
			</div>

			{#if addError}
				<div class="error" style="margin-top: 10px;">{addError}</div>
			{/if}

			<div class="row" style="margin-top: 12px;">
				<button class="btn btn-ghost" onclick={fillWithAI} disabled={aiBusy}>
					{aiBusy ? t('gear.lookingUp') : t('gear.fillWithAI')}
				</button>
				<div class="spacer"></div>
				<button class="btn btn-ghost" onclick={() => (showAdd = false)}>{t('common.cancel')}</button>
				<button class="btn btn-primary" onclick={addLens}>{t('gear.addLensBtn')}</button>
			</div>
			<p class="muted" style="font-size: 0.78rem; margin-top: 8px;">
				{t('gear.aiNote')}
			</p>
		</div>
	{:else}
		<button class="btn btn-block btn-ghost" onclick={openAdd}>{t('gear.addLensShort')}</button>
	{/if}

	<div class="card" style="margin-top: 12px;">
		<h3>{t('gear.selectedRig')}</h3>
		<p>
			<strong>{activeBody.make} {activeBody.model}</strong><br />
			{#if activeRig?.lensId}
				{#each compatibleLenses as lens}
					{#if lens.id === activeRig.lensId}
						<span class="muted">{lens.make} {lens.model} ({lensSummary(lens)})</span>
					{/if}
				{/each}
			{:else}
				<span class="muted">{t('gear.noLens')}</span>
			{/if}
		</p>
		{#if activeAdapter}
			<div class="note" style="margin-bottom: 10px;">
				{t('gear.adapterNote', { mount: (activeLensObj?.mount ?? '').toUpperCase(), adapter: activeAdapter ?? '' })}
			</div>
		{/if}
		<a class="btn btn-primary btn-block" href="/session">{t('gear.shootWithRig')}</a>
	</div>
{/if}
