<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { allBodies, allLenses } from '$lib/gear/catalog';
	import { useLiveQuery } from '$lib/db/live.svelte';
	import { PROVIDERS } from '$lib/llm/providers';
	import { t } from '$lib/i18n';

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
	<p class="muted">{t('home.hero')}</p>
</div>

{#if !hasKey}
	<div class="note">
		{t('home.noKeyNoteStart')} <a href="/settings">{t('nav.setup')}</a>{t('home.noKeyNoteEnd')}
	</div>
{:else}
	<div class="card">
		<h3>{t('home.ready')}</h3>
		<div class="row">
			<div>
				<strong>{activeBody ? `${activeBody.make} ${activeBody.model}` : t('home.noCamera')}</strong>
				{#if activeLens}
					<div class="muted">{activeLens.make} {activeLens.model}</div>
				{/if}
			</div>
			<div class="spacer"></div>
			<span class="badge">{providerLabel}</span>
		</div>
		<a class="btn btn-primary btn-block" href="/session" style="margin-top: 12px;">{t('home.startSession')}</a>
		<a class="btn btn-ghost btn-block" href="/gear" style="margin-top: 8px;">{t('home.changeGear')}</a>
	</div>
{/if}

<div class="card">
	<h3>{t('home.howItWorks')}</h3>
	<ol style="margin: 0; padding-left: 18px; color: var(--muted);">
		<li>{t('home.step1Pre')} <a href="/gear">{t('nav.gear')}</a>{t('home.step1Post')}</li>
		<li>{t('home.step2')}</li>
		<li>{t('home.step3')}</li>
		<li>{t('home.step4')}</li>
	</ol>
</div>
