import { browser } from '$app/environment';
import { db, SETTINGS_KEY, type SettingsRecord } from '$lib/db/schema';
import { PROVIDER_LIST } from '$lib/llm/providers';
import type { ProviderConfig, Settings } from '$lib/types/settings';

export function defaultSettings(): Settings {
	return {
		activeProvider: 'openrouter',
		skillLevel: 'intermediate',
		units: 'metric',
		llmAugmentGear: true,
		activeRig: { bodyId: 'body_canon_eos_r8', lensId: 'lens_canon_rf_50_1.8' },
		providers: Object.fromEntries(
			PROVIDER_LIST.map((p) => [
				p.key,
				{
					key: p.key,
					apiKey: '',
					textModel: p.defaultTextModel,
					visionModel: p.defaultVisionModel
				} satisfies ProviderConfig
			])
		) as Settings['providers']
	};
}

class SettingsStore {
	current = $state<Settings>(defaultSettings());
	loaded = $state(false);

	/** Load persisted settings from IndexedDB; safe to call repeatedly. */
	async load() {
		if (this.loaded || !browser) return;
		const rec = await db().settings.get(SETTINGS_KEY);
		if (rec) {
			const { id: _id, ...rest } = rec as SettingsRecord;
			// Merge over defaults so new fields are filled in across versions.
			this.current = { ...defaultSettings(), ...rest };
		}
		this.loaded = true;
		// Ask for persistent storage where the browser honors it (desktop/Android; no-op on iOS).
		try {
			await navigator.storage?.persist?.();
		} catch {
			// ignore — not all browsers support it
		}
	}

	async save(next: Settings) {
		this.current = next;
		if (!browser) return;
		// IndexedDB structuredClone throws on Svelte $state proxies, and `{...current}`
		// only shallow-copies (nested providers/activeRig stay proxied). Store a deep
		// plain copy so the write succeeds.
		const record = JSON.parse(JSON.stringify({ id: SETTINGS_KEY, ...next })) as SettingsRecord;
		await db().settings.put(record);
	}

	/** Convenience: the config for the currently active provider. */
	get active(): ProviderConfig {
		return this.current.providers[this.current.activeProvider];
	}
}

export const settings = new SettingsStore();
