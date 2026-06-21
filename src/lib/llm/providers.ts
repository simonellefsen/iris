import type { ProviderKey } from '$lib/types/settings';

export type AuthType = 'bearer' | 'x-api-key' | 'x-goog-api-key';

export interface ProviderMeta {
	key: ProviderKey;
	label: string;
	baseURL: string;
	authType: AuthType;
	supportsVision: boolean;
	visionQuality: 'strong' | 'good' | 'fair';
	/** Sensible starting models — the user can change these in Settings. */
	defaultTextModel: string;
	defaultVisionModel: string;
	helpURL: string;
}

/**
 * Metadata for every supported provider. Defaults are editable in Settings.
 * All endpoints are reachable directly from the browser (CORS) with BYOK keys.
 */
export const PROVIDER_LIST: ProviderMeta[] = [
	{
		key: 'openrouter',
		label: 'OpenRouter',
		baseURL: 'https://openrouter.ai/api/v1',
		authType: 'bearer',
		supportsVision: true,
		visionQuality: 'strong',
		defaultTextModel: 'anthropic/claude-sonnet-4.5',
		defaultVisionModel: 'openai/gpt-4o',
		helpURL: 'https://openrouter.ai/keys'
	},
	{
		key: 'openai',
		label: 'OpenAI',
		baseURL: 'https://api.openai.com/v1',
		authType: 'bearer',
		supportsVision: true,
		visionQuality: 'strong',
		defaultTextModel: 'gpt-4o-mini',
		defaultVisionModel: 'gpt-4o',
		helpURL: 'https://platform.openai.com/api-keys'
	},
	{
		key: 'anthropic',
		label: 'Anthropic (Claude)',
		baseURL: 'https://api.anthropic.com/v1',
		authType: 'x-api-key',
		supportsVision: true,
		visionQuality: 'strong',
		defaultTextModel: 'claude-sonnet-4-6',
		defaultVisionModel: 'claude-sonnet-4-6',
		helpURL: 'https://console.anthropic.com/settings/keys'
	},
	{
		key: 'gemini',
		label: 'Google Gemini',
		baseURL: 'https://generativelanguage.googleapis.com/v1beta',
		authType: 'x-goog-api-key',
		supportsVision: true,
		visionQuality: 'strong',
		defaultTextModel: 'gemini-2.0-flash',
		defaultVisionModel: 'gemini-2.0-flash',
		helpURL: 'https://aistudio.google.com/apikey'
	},
	{
		key: 'grok',
		label: 'xAI Grok',
		baseURL: 'https://api.x.ai/v1',
		authType: 'bearer',
		supportsVision: true,
		visionQuality: 'fair',
		defaultTextModel: 'grok-2-1212',
		defaultVisionModel: 'grok-2-vision-1212',
		helpURL: 'https://console.x.ai'
	}
];

export const PROVIDERS: Record<ProviderKey, ProviderMeta> = Object.fromEntries(
	PROVIDER_LIST.map((p) => [p.key, p])
) as Record<ProviderKey, ProviderMeta>;
