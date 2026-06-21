import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ChatMessage, ImageBlock } from './provider';
import {
	parseJsonLoose,
	toAnthropicContent,
	toGeminiContents,
	toOpenAIMessages,
	zodToJsonSchema
} from './structured';

describe('parseJsonLoose', () => {
	it('parses raw JSON', () => {
		expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
	});
	it('strips ```json code fences', () => {
		expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 });
	});
	it('extracts JSON embedded in prose', () => {
		expect(parseJsonLoose('Here is your task: {"a":1} done')).toEqual({ a: 1 });
	});
	it('parses top-level arrays', () => {
		expect(parseJsonLoose('[1,2,3]')).toEqual([1, 2, 3]);
	});
	it('throws on non-JSON input', () => {
		expect(() => parseJsonLoose('totally not json')).toThrow();
	});
});

const image: ImageBlock = { type: 'image', mediaType: 'image/jpeg', base64: 'AAA' };

describe('OpenAI-compatible message shape', () => {
	it('turns system into a string and user blocks into text + image_url', () => {
		const msgs: ChatMessage[] = [
			{ role: 'system', content: 'sys' },
			{ role: 'user', content: [{ type: 'text', text: 'hi' }, image] }
		];
		const out = toOpenAIMessages(msgs);
		expect(out[0]).toEqual({ role: 'system', content: 'sys' });
		const user = out[1] as { role: string; content: unknown[] };
		expect(user.content[0]).toEqual({ type: 'text', text: 'hi' });
		expect(user.content[1]).toEqual({
			type: 'image_url',
			image_url: { url: 'data:image/jpeg;base64,AAA' }
		});
	});
});

describe('Anthropic content shape', () => {
	it('emits a base64 image source with snake_case media_type', () => {
		const out = toAnthropicContent([{ type: 'text', text: 'hi' }, image]);
		expect(out[1]).toEqual({
			type: 'image',
			source: { type: 'base64', media_type: 'image/jpeg', data: 'AAA' }
		});
	});
});

describe('Gemini content shape', () => {
	it('maps assistant -> model and emits inlineData', () => {
		const msgs: ChatMessage[] = [
			{ role: 'system', content: 'sys' },
			{ role: 'user', content: [{ type: 'text', text: 'hi' }, image] }
		];
		const c = toGeminiContents(msgs);
		expect(c.length).toBe(1); // system is dropped from contents
		expect(c[0].role).toBe('user');
		expect(c[0].parts[1]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: 'AAA' } });
	});
});

describe('zodToJsonSchema', () => {
	it('produces a JSON Schema object from a Zod schema', () => {
		const schema = zodToJsonSchema(z.object({ aperture: z.number() }));
		expect(schema).toHaveProperty('type');
	});
});
