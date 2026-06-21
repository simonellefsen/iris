<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { settings } from '$lib/stores/settings.svelte';
	import { migrateCatalog, seedCatalogIfEmpty } from '$lib/gear/catalog';
	import { detectBrowserLocale, t } from '$lib/i18n';

	let { children } = $props();

	onMount(async () => {
		// Seed the curated catalog and hydrate settings on first load.
		try {
			await seedCatalogIfEmpty();
			await migrateCatalog();
		} catch (e) {
			console.warn('Catalog seed/migrate failed', e);
		}
		await settings.load();
		// First run (no persisted record yet): adopt the browser's language so the
		// app starts in the user's preferred language. Persisted users keep their choice.
		if (!settings.persisted) {
			await settings.save({ ...settings.current, locale: detectBrowserLocale() });
		}
	});

	// $derived so nav labels re-render when the locale changes.
	const tabs = $derived([
		{ href: '/', label: t('nav.home'), icon: '🏠' },
		{ href: '/session', label: t('nav.shoot'), icon: '📷' },
		{ href: '/gear', label: t('nav.gear'), icon: '🎚️' },
		{ href: '/history', label: t('nav.history'), icon: '📜' },
		{ href: '/settings', label: t('nav.setup'), icon: '⚙️' }
	]);

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<div class="app-shell">
	{@render children()}
</div>

<nav class="nav">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} class={isActive(tab.href) ? 'active' : ''}>
			<span class="icon">{tab.icon}</span>
			<span>{tab.label}</span>
		</a>
	{/each}
</nav>
