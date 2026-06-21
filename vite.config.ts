/// <reference types="vitest/config" />
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Vercel-native adapter. The app is a client-side SPA (ssr=false), so this
			// produces a static output with a fallback served for all routes. Pin the runtime
			// so the build is reproducible regardless of the local Node version.
			adapter: adapter({ runtime: 'nodejs22.x' })
		}),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			manifest: {
				name: 'Iris',
				short_name: 'Iris',
				description: 'A location-aware photography coach that designs tasks and critiques your shots.',
				theme_color: '#0f172a',
				background_color: '#0f172a',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
					{
						src: '/icon-maskable.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'open-meteo-cache',
							networkTimeoutSeconds: 8,
							expiration: { maxEntries: 50, maxAgeSeconds: 30 * 60 }
						}
					},
					{
						urlPattern: /^https:\/\/api\.bigdatacloud\.net\/.*/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'geocode-cache',
							expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
						}
					}
				]
			},
			// Keep `pnpm dev` fast: the service worker only ships in build/preview,
			// where the full offline/installable PWA can be verified.
			devOptions: { enabled: false }
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom'
	}
});
