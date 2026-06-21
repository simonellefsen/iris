import type { ActiveRig } from './gear';
import type { LocaleId } from '$lib/i18n/locales';

export type ProviderKey = 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'grok';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type Units = 'metric' | 'imperial';

export interface ProviderConfig {
	key: ProviderKey;
	apiKey: string; // stored client-side (BYOK)
	textModel: string; // model id for task generation
	visionModel: string; // model id for evaluation
}

export interface Settings {
	providers: Record<ProviderKey, ProviderConfig>;
	activeProvider: ProviderKey;
	skillLevel: SkillLevel;
	units: Units;
	llmAugmentGear: boolean; // allow the LLM to fill specs for unknown gear
	activeRig: ActiveRig | null; // the body + lens selected for the next session
	locale: LocaleId; // UI + LLM output language (new sessions/tasks use this)
}
