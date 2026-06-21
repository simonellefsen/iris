<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { settings } from '$lib/stores/settings.svelte';
	import { seedCatalogIfEmpty } from '$lib/gear/catalog';

	let { children } = $props();

	onMount(async () => {
		// Seed the curated catalog and hydrate settings on first load.
		try {
			await seedCatalogIfEmpty();
		} catch (e) {
			console.warn('Catalog seed failed', e);
		}
		await settings.load();
	});

	const tabs = [
		{ href: '/', label: 'Home', icon: '🏠' },
		{ href: '/session', label: 'Shoot', icon: '📷' },
		{ href: '/gear', label: 'Gear', icon: '🎚️' },
		{ href: '/history', label: 'History', icon: '📜' },
		{ href: '/settings', label: 'Setup', icon: '⚙️' }
	];

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
