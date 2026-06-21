import type { ProviderConfig } from '$lib/types/settings';
import type { ProviderMeta } from './providers';
import type { LLMProvider, StructuredRequest, StructuredResponse, ValidationResult } from './provider';
import { httpError, parseJsonLoose, toOpenAIMessages } from './structured';

/**
 * OpenAI-compatible Chat Completions adapter. Drives OpenRouter, OpenAI, and xAI Grok,
 * which all share the `/chat/completions` endpoint, Bearer auth, OpenAI-style multimodal
 * message content, and `response_format: json_schema`.
 */
export class OpenAICompatibleProvider implements LLMProvider {
	constructor(
		private meta: ProviderMeta,
		private cfg: ProviderConfig
	) {}

	get id() {
		return this.meta.key;
	}
	get supportsVision() {
		return this.meta.supportsVision;
	}

	private headers(): Record<string, string> {
		const h: Record<string, string> = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.cfg.apiKey}`
		};
		// OpenRouter recommends attribution headers; harmless elsewhere but only set for it.
		if (this.meta.key === 'openrouter') {
			h['HTTP-Referer'] = typeof location !== 'undefined' ? location.origin : 'https://iris.app';
			h['X-Title'] = 'Iris';
		}
		return h;
	}

	private model(req: StructuredRequest): string {
		return req.model ?? (req.vision ? this.cfg.visionModel : this.cfg.textModel);
	}

	async generateStructured(req: StructuredRequest): Promise<StructuredResponse> {
		const body = {
			model: this.model(req),
			messages: toOpenAIMessages(req.messages),
			temperature: req.temperature ?? 0.7,
			...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
			response_format: {
				type: 'json_schema',
				json_schema: { name: req.schemaName, schema: req.schema, strict: false }
			}
		};
		const res = await fetch(`${this.meta.baseURL}/chat/completions`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(httpError(await res.text(), res.status));
		const data = (await res.json()) as {
			choices?: { message?: { content?: string | null } }[];
			usage?: { prompt_tokens?: number; completion_tokens?: number };
		};
		const text = data.choices?.[0]?.message?.content ?? '';
		return {
			json: parseJsonLoose(text),
			usage: { inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens }
		};
	}

	async validateKey(): Promise<ValidationResult> {
		try {
			const res = await fetch(`${this.meta.baseURL}/models`, { headers: this.headers() });
			if (!res.ok) return { ok: false, error: httpError(await res.text(), res.status) };
			const data = (await res.json()) as { data?: { id?: string }[]; models?: { id?: string }[] };
			const list = data.data ?? data.models ?? [];
			return {
				ok: true,
				models: list.map((m) => m.id).filter((x): x is string => Boolean(x))
			};
		} catch (e) {
			return { ok: false, error: e instanceof Error ? e.message : String(e) };
		}
	}
}
