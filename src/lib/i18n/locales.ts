// Locale model for Iris. A *locale* (en-US / en-GB / da) drives three things:
//   1. which UI dictionary is used (the `ui` key — en-US and en-GB share 'en'),
//   2. Intl date/number formatting (the `bcp47` tag),
//   3. the output language we instruct the LLM to write in (`languageName`).
//
// New sessions/tasks are generated in the active locale; existing sessions keep
// whatever language they were created in (they are stored, never re-translated).

export type LocaleId = 'en-US' | 'en-GB' | 'da';
export type UiKey = 'en' | 'da';

export interface LocaleMeta {
	id: LocaleId;
	/** Native label for the picker, e.g. "Dansk". */
	label: string;
	/** English disambiguator, e.g. "Danish". */
	english: string;
	/** Which UI dictionary to use (en-US and en-GB share 'en'). */
	ui: UiKey;
	/** BCP-47 tag for Intl date/number formatting. */
	bcp47: string;
	/** Human language name for the LLM output-language instruction. */
	languageName: string;
}

export const DEFAULT_LOCALE: LocaleId = 'en-US';

export const SUPPORTED_LOCALES: LocaleMeta[] = [
	{
		id: 'en-US',
		label: 'English (US)',
		english: 'English (US)',
		ui: 'en',
		bcp47: 'en-US',
		languageName: 'American English'
	},
	{
		id: 'en-GB',
		label: 'English (UK)',
		english: 'English (UK)',
		ui: 'en',
		bcp47: 'en-GB',
		languageName: 'British English'
	},
	{
		id: 'da',
		label: 'Dansk',
		english: 'Danish',
		ui: 'da',
		bcp47: 'da-DK',
		languageName: 'Danish'
	}
];

const byId = new Map<LocaleId, LocaleMeta>(SUPPORTED_LOCALES.map((l) => [l.id, l]));

export function isSupportedLocale(id: string): id is LocaleId {
	return byId.has(id as LocaleId);
}

/** Locale metadata, falling back to the default for an unknown id. */
export function localeMeta(id: LocaleId | string | undefined): LocaleMeta {
	return byId.get(id as LocaleId) ?? (byId.get(DEFAULT_LOCALE) as LocaleMeta);
}

/** Resolve a locale id (or raw string) to its UI dictionary key. */
export function uiKeyFor(id: LocaleId | string | undefined): UiKey {
	return localeMeta(id).ui;
}

/**
 * Pick the best supported locale for the browser's language preferences.
 * Tries each navigator.languages entry: an exact (case-insensitive) match first,
 * then a language-only match. en defaults to US English unless a GB variant is
 * preferred. Falls back to the project default (en-US) when nothing matches or
 * the browser is unavailable (SSR).
 */
export function detectBrowserLocale(): LocaleId {
	if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
	const prefs = navigator.languages?.length ? [...navigator.languages] : [navigator.language];

	// 1) exact regional match, e.g. "en-GB", "da-DK", "en-us".
	for (const raw of prefs) {
		if (!raw) continue;
		const exact = SUPPORTED_LOCALES.find((l) => l.id.toLowerCase() === raw.toLowerCase());
		if (exact) return exact.id;
	}
	// 2) language-only match.
	for (const raw of prefs) {
		if (!raw) continue;
		const lang = raw.toLowerCase().split(/[-_]/)[0];
		if (lang === 'da') return 'da';
		if (lang === 'en') return raw.toLowerCase().includes('gb') ? 'en-GB' : 'en-US';
	}
	return DEFAULT_LOCALE;
}
