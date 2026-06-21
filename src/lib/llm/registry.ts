import { settings } from '$lib/stores/settings.svelte';
import type { ProviderConfig, ProviderKey } from '$lib/types/settings';
import type { LLMProvider } from './provider';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAICompatibleProvider } from './openaiCompatible';
import { PROVIDERS } from './providers';

/** Build a provider adapter from explicit config (e.g. for testing a key the user just typed). */
export function createProvider(key: ProviderKey, cfg: ProviderConfig): LLMProvider {
	const meta = PROVIDERS[key];
	switch (key) {
		case 'anthropic':
			return new AnthropicProvider(meta, cfg);
		case 'gemini':
			return new GeminiProvider(meta, cfg);
		default:
			// openrouter, openai, and grok all speak OpenAI-compatible Chat Completions
			return new OpenAICompatibleProvider(meta, cfg);
	}
}

/** Build a provider using the stored config for `key`. */
export function getProvider(key: ProviderKey): LLMProvider {
	const s = settings.current;
	return createProvider(key, s.providers[key]);
}

/** The provider selected as active in Settings. */
export function activeProvider(): LLMProvider {
	return getProvider(settings.current.activeProvider);
}
