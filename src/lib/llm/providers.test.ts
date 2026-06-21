import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAICompatibleProvider } from './openaiCompatible';
import { PROVIDERS } from './providers';
import type { ProviderConfig, ProviderKey } from '$lib/types/settings';

/** Minimal Response-like object — avoids depending on the global Response in jsdom. */
function mockResponse(data: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => data,
		text: async () => JSON.stringify(data)
	};
}

function cfg(key: ProviderKey): ProviderConfig {
	return { key, apiKey: 'k_test', textModel: 'm-text', visionModel: 'm-vision' };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn(async () => mockResponse({ choices: [{ message: { content: '{}' } }], usage: {} }));
	vi.stubGlobal('fetch', fetchMock);
});

async function lastCall(): Promise<[string, RequestInit]> {
	const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
	return [url as string, init as RequestInit];
}

function headers(init: RequestInit): Record<string, string> {
	return (init.headers ?? {}) as Record<string, string>;
}

describe('OpenAI-compatible adapter (OpenRouter)', () => {
	it('posts to /chat/completions with json_schema response_format and Bearer auth', async () => {
		const p = new OpenAICompatibleProvider(PROVIDERS.openrouter, cfg('openrouter'));
		await p.generateStructured({
			messages: [{ role: 'user', content: 'hi' }],
			schema: { type: 'object' },
			schemaName: 'task'
		});
		const [url, init] = await lastCall();
		expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
		const body = JSON.parse(init.body as string);
		expect(body.response_format.type).toBe('json_schema');
		expect(body.response_format.json_schema.name).toBe('task');
		expect(headers(init).Authorization).toBe('Bearer k_test');
	});

	it('selects the vision model when vision:true', async () => {
		const p = new OpenAICompatibleProvider(PROVIDERS.openai, cfg('openai'));
		await p.generateStructured({
			messages: [{ role: 'user', content: 'hi' }],
			schema: { type: 'object' },
			schemaName: 'task',
			vision: true
		});
		const [, init] = await lastCall();
		expect(JSON.parse(init.body as string).model).toBe('m-vision');
	});
});

describe('Anthropic adapter', () => {
	it('forces a single tool and sets the dangerous-direct-browser-access header', async () => {
		fetchMock.mockResolvedValueOnce(
			mockResponse({
				content: [{ type: 'tool_use', input: { objective: 'x' } }],
				usage: {}
			})
		);
		const p = new AnthropicProvider(PROVIDERS.anthropic, cfg('anthropic'));
		const out = await p.generateStructured({
			messages: [
				{ role: 'system', content: 'sys' },
				{ role: 'user', content: 'hi' }
			],
			schema: { type: 'object' },
			schemaName: 'task'
		});
		const [url, init] = await lastCall();
		expect(url).toBe('https://api.anthropic.com/v1/messages');
		const body = JSON.parse(init.body as string);
		expect(body.tool_choice.type).toBe('tool');
		expect(body.tools[0].name).toBe('task');
		expect(body.system).toBe('sys'); // system hoisted out of messages
		expect(headers(init)['anthropic-dangerous-direct-browser-access']).toBe('true');
		expect(headers(init)['x-api-key']).toBe('k_test');
		expect(out.json).toEqual({ objective: 'x' });
	});
});

describe('Gemini adapter', () => {
	it('puts the model in the path, uses x-goog-api-key, and sets responseSchema', async () => {
		fetchMock.mockResolvedValueOnce(
			mockResponse({
				candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }],
				usageMetadata: {}
			})
		);
		const p = new GeminiProvider(PROVIDERS.gemini, cfg('gemini'));
		const out = await p.generateStructured({
			messages: [{ role: 'user', content: 'hi' }],
			schema: { type: 'object' },
			schemaName: 'task'
		});
		const [url, init] = await lastCall();
		expect(url).toBe(
			'https://generativelanguage.googleapis.com/v1beta/models/m-text:generateContent'
		);
		const body = JSON.parse(init.body as string);
		expect(body.generationConfig.responseMimeType).toBe('application/json');
		expect(body.generationConfig.responseSchema).toEqual({ type: 'object' });
		expect(headers(init)['x-goog-api-key']).toBe('k_test');
		expect(out.json).toEqual({ a: 1 });
	});
});

describe('validateKey', () => {
	it('OpenAI-compatible probes GET /models and returns the id list', async () => {
		fetchMock.mockResolvedValueOnce(mockResponse({ data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }] }));
		const p = new OpenAICompatibleProvider(PROVIDERS.openai, cfg('openai'));
		const r = await p.validateKey();
		const [url, init] = await lastCall();
		expect(init.method ?? 'GET').toBe('GET'); // no body => GET
		expect(url).toBe('https://api.openai.com/v1/models');
		expect(r.ok).toBe(true);
		expect(r.models).toEqual(['gpt-4o', 'gpt-4o-mini']);
	});
});
