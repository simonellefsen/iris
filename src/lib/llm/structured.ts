import { z } from 'zod';
import type { ChatMessage, ContentBlock } from './provider';

/** Convert a Zod schema to a plain JSON Schema for the provider request. Zod v4 has this built in. */
export function zodToJsonSchema(schema: z.ZodType): object {
	return z.toJSONSchema(schema);
}

/** Best-effort JSON extraction: handles raw JSON, ```json fences, and embedded JSON. */
export function parseJsonLoose(text: string): unknown {
	if (!text) return null;
	const trimmed = text.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		/* keep trying */
	}
	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenced) {
		try {
			return JSON.parse(fenced[1].trim());
		} catch {
			/* keep trying */
		}
	}
	const first = trimmed.indexOf('{');
	const last = trimmed.lastIndexOf('}');
	if (first !== -1 && last > first) {
		return JSON.parse(trimmed.slice(first, last + 1));
	}
	const firstArr = trimmed.indexOf('[');
	const lastArr = trimmed.lastIndexOf(']');
	if (firstArr !== -1 && lastArr > firstArr) {
		return JSON.parse(trimmed.slice(firstArr, lastArr + 1));
	}
	throw new Error('Model did not return valid JSON');
}

export function httpError(body: string, status: number): string {
	let msg = `HTTP ${status}`;
	try {
		const j = JSON.parse(body);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		msg += `: ${j?.error?.message || j?.message || body.slice(0, 160)}`;
	} catch {
		msg += `: ${body.slice(0, 160)}`;
	}
	return msg;
}

export function blocks(content: string | ContentBlock[]): ContentBlock[] {
	return typeof content === 'string' ? [{ type: 'text', text: content }] : content;
}

export function systemText(messages: ChatMessage[]): string {
	return messages
		.filter((m) => m.role === 'system')
		.map((m) => (typeof m.content === 'string' ? m.content : blocks(m.content).map((b) => (b.type === 'text' ? b.text : '')).join('')))
		.join('\n\n');
}

export function nonSystem(messages: ChatMessage[]): ChatMessage[] {
	return messages.filter((m) => m.role !== 'system');
}

/** OpenAI-compatible message shape (OpenRouter / OpenAI / Grok). */
export function toOpenAIMessages(messages: ChatMessage[]) {
	return messages.map((m) => {
		if (m.role === 'system' || typeof m.content === 'string') {
			const text = typeof m.content === 'string' ? m.content : blocks(m.content).map((b) => (b.type === 'text' ? b.text : '')).join('');
			return { role: m.role, content: text };
		}
		return {
			role: m.role,
			content: blocks(m.content).map((b) =>
				b.type === 'text'
					? { type: 'text', text: b.text }
					: { type: 'image_url', image_url: { url: `data:${b.mediaType};base64,${b.base64}` } }
			)
		};
	});
}

/** Anthropic content-block shape. */
export function toAnthropicContent(content: string | ContentBlock[]) {
	return blocks(content).map((b) =>
		b.type === 'text'
			? { type: 'text', text: b.text }
			: { type: 'image', source: { type: 'base64', media_type: b.mediaType, data: b.base64 } }
	);
}

/** Gemini parts shape. */
export function toGeminiParts(content: string | ContentBlock[]) {
	return blocks(content).map((b) =>
		b.type === 'text' ? { text: b.text } : { inlineData: { mimeType: b.mediaType, data: b.base64 } }
	);
}

export function toGeminiContents(messages: ChatMessage[]) {
	return nonSystem(messages).map((m) => ({
		role: m.role === 'assistant' ? 'model' : 'user',
		parts: toGeminiParts(m.content)
	}));
}
