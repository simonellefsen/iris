// Reactive i18n entry point. `t()` reads the active locale from the settings
// store (a Svelte 5 $state singleton), so it is reactive inside component
// templates and just returns the current value when called from plain TS
// (e.g. pipeline prompts, which run outside the render cycle).

export * from './locales';
export {
	translate,
	weatherText,
	lightPhaseLabel,
	lightLabel,
	difficultyLabel,
	motionLabel,
	type MessageKey,
	type TranslateParams
} from './messages';

import { settings } from '$lib/stores/settings.svelte';
import { uiKeyFor, type LocaleId } from './locales';
import { translate, type MessageKey, type TranslateParams } from './messages';

/** The currently active locale id, read live from persisted settings. */
export function currentLocale(): LocaleId {
	return settings.current.locale;
}

/**
 * Translate a message key in the active UI language, with {param} interpolation.
 * Reactive in Svelte templates (reads settings.current.locale); current-value
 * in plain TS.
 *
 *   t('session.brief')
 *   t('constraint.aperture', { n: 2.8 })
 */
export function t(key: MessageKey, params?: TranslateParams): string {
	return translate(uiKeyFor(settings.current.locale), key, params);
}
