import type { ProviderConfig } from '$lib/types/settings';
import type { ProviderMeta } from './providers';
import type { LLMProvider, StructuredRequest, StructuredResponse, ValidationResult } from './provider';
import { httpError, parseJsonLoose, systemText, toGeminiContents } from './structured';

/**
 * Google Gemini (generativelanguage) adapter. Structured output via
 * `responseMimeType: application/json` + `responseSchema`. Auth via `x-goog-api-key` header.
 */
export class GeminiProvider implements LLMProvider {
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
		return { 'Content-Type': 'application/json', 'x-goog-api-key': this.cfg.apiKey };
	}

	private model(req: StructuredRequest): string {
		return req.model ?? (req.vision ? this.cfg.visionModel : this.cfg.textModel);
	}

	async generateStructured(req: StructuredRequest): Promise<StructuredResponse> {
		const system = systemText(req.messages);
		const body = {
			contents: toGeminiContents(req.messages),
			...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
			generationConfig: {
				temperature: req.temperature ?? 0.7,
				...(req.maxTokens ? { maxOutputTokens: req.maxTokens } : {}),
				responseMimeType: 'application/json',
				responseSchema: req.schema
			}
		};
		const res = await fetch(`${this.meta.baseURL}/models/${this.model(req)}:generateContent`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(httpError(await res.text(), res.status));
		const data = (await res.json()) as {
			candidates?: { content?: { parts?: { text?: string }[] } }[];
			usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
		};
		const text =
			data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') ?? '';
		return {
			json: parseJsonLoose(text),
			usage: {
				inputTokens: data.usageMetadata?.promptTokenCount,
				outputTokens: data.usageMetadata?.candidatesTokenCount
			}
		};
	}

	async validateKey(): Promise<ValidationResult> {
		try {
			const res = await fetch(`${this.meta.baseURL}/models`, { headers: this.headers() });
			if (!res.ok) return { ok: false, error: httpError(await res.text(), res.status) };
			const data = (await res.json()) as { models?: { name?: string }[] };
			return {
				ok: true,
				models: (data.models ?? [])
					.map((m) => m.name?.replace('models/', ''))
					.filter((x): x is string => Boolean(x))
			};
		} catch (e) {
			return { ok: false, error: e instanceof Error ? e.message : String(e) };
		}
	}
}
