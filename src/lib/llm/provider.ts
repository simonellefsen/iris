import type { ProviderKey } from '$lib/types/settings';

export type MediaType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface TextBlock {
	type: 'text';
	text: string;
}

export interface ImageBlock {
	type: 'image';
	mediaType: MediaType;
	base64: string;
}

export type ContentBlock = TextBlock | ImageBlock;

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	/** Plain string (system/assistant) or a mix of text + image blocks (multimodal user). */
	content: string | ContentBlock[];
}

export interface StructuredRequest {
	messages: ChatMessage[];
	/** JSON Schema describing the desired output object. */
	schema: object;
	schemaName: string;
	temperature?: number;
	maxTokens?: number;
	/** When true the adapter selects the configured vision model. */
	vision?: boolean;
	/** Override the model id; otherwise text/vision model is chosen by `vision`. */
	model?: string;
}

export interface StructuredResponse {
	json: unknown;
	usage?: { inputTokens?: number; outputTokens?: number };
}

export interface ValidationResult {
	ok: boolean;
	error?: string;
	models?: string[];
}

export interface LLMProvider {
	readonly id: ProviderKey;
	readonly supportsVision: boolean;
	generateStructured(req: StructuredRequest): Promise<StructuredResponse>;
	validateKey(): Promise<ValidationResult>;
}
