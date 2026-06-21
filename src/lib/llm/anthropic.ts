import type { ProviderConfig } from '$lib/types/settings';
import type { ProviderMeta } from './providers';
import type { LLMProvider, StructuredRequest, StructuredResponse, ValidationResult } from './provider';
import { httpError, nonSystem, systemText, toAnthropicContent } from './structured';

/**
 * Anthropic Messages API adapter. Uses a single forced tool to obtain structured JSON
 * (the tool's input_schema is our output schema), and the critical
 * `anthropic-dangerous-direct-browser-access` header for direct browser calls.
 */
export class AnthropicProvider implements LLMProvider {
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
		return {
			'Content-Type': 'application/json',
			'x-api-key': this.cfg.apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true'
		};
	}

	private model(req: StructuredRequest): string {
		return req.model ?? (req.vision ? this.cfg.visionModel : this.cfg.textModel);
	}

	async generateStructured(req: StructuredRequest): Promise<StructuredResponse> {
		const system = systemText(req.messages);
		const messages = nonSystem(req.messages).map((m) => ({
			role: m.role,
			content: toAnthropicContent(m.content)
		}));
		const body = {
			model: this.model(req),
			max_tokens: req.maxTokens ?? 2048,
			...(system ? { system } : {}),
			messages,
			tools: [
				{
					name: req.schemaName,
					description: 'Return the requested result as structured data.',
					input_schema: req.schema
				}
			],
			tool_choice: { type: 'tool', name: req.schemaName }
		};
		const res = await fetch(`${this.meta.baseURL}/messages`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(httpError(await res.text(), res.status));
		const data = (await res.json()) as {
			content?: { type: string; input?: unknown; text?: string }[];
			usage?: { input_tokens?: number; output_tokens?: number };
		};
		const toolUse = data.content?.find((b) => b.type === 'tool_use');
		const json = toolUse?.input ?? (data.content?.find((b) => b.type === 'text')?.text ?? null);
		return {
			json,
			usage: { inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens }
		};
	}

	async validateKey(): Promise<ValidationResult> {
		try {
			const res = await fetch(`${this.meta.baseURL}/messages`, {
				method: 'POST',
				headers: this.headers(),
				body: JSON.stringify({
					model: this.cfg.textModel,
					max_tokens: 1,
					messages: [{ role: 'user', content: 'ping' }]
				})
			});
			if (!res.ok) return { ok: false, error: httpError(await res.text(), res.status) };
			return { ok: true };
		} catch (e) {
			return { ok: false, error: e instanceof Error ? e.message : String(e) };
		}
	}
}
