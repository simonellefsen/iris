# Decision: Multilingual UI + LLM output (English, Danish)

**Date**: 2026-06-21
**Status**: accepted

## Context

The app is built and field-tested in English. The primary user also wants Danish, and the UX should
speak the user's language — both the app chrome (nav, buttons, headings) and the LLM-generated task
and critique content. Requirements stated by the user:

- Support primarily **English (US/UK)** and **Danish**.
- The user can change the language in Settings.
- **Sessions/tasks are generated in the user's preferred language.**
- **Already-given sessions/tasks keep their original language** (no retroactive re-translation).
- Detect the language from the browser when possible.

## Decision

A lightweight, dependency-free i18n layer in [`src/lib/i18n/`](../../src/lib/i18n/):

- **Locales**: `en-US`, `en-GB`, `da`. `en-US` and `en-GB` share one `en` UI dictionary and differ
  only in Intl formatting (BCP-47 tag) and the LLM spelling hint (`American`/`British English`);
  `da` has its own dictionary. This avoids maintaining two near-identical English dictionaries.
- **UI strings** (`messages.ts`): a flat dotted-key dictionary; `en` is the source of truth and `da`
  is typed `Record<MessageKey, string>` so a missing/extra key is a compile error. A reactive
  `t(key, params)` in `index.ts` reads `settings.current.locale` (a `$state`), so it updates live in
  templates and returns the current value in plain TS. `{param}` placeholders handle word-order
  differences between languages.
- **Settings**: `Settings.locale` (default `en-US`); a language picker in Setup bound to the draft
  (applies on Save, like every other setting there). On **first run** (no persisted record),
  `+layout.svelte` adopts `detectBrowserLocale()` from `navigator.languages` and persists it.
- **LLM output language**: the task and eval **system prompts** take the locale's `languageName`
  (`taskSystemPrompt` / `evalSystemPrompt`) and instruct the model to write all free-text in it,
  keeping mode-dial letters, f-numbers, and brand names untranslated. The eval dimension names stay
  fixed English (they are scoring keys). New tasks/evals are generated in the active language.
- **Context-derived strings** (weather conditions, light-phase labels) are localized at **gather
  time** by threading a `UiKey` through `gatherContext` → `getWeather` / `getLight`.
- **Enums** (`difficulty`, `motionType`) are localized at **render time** (`difficultyLabel` /
  `motionLabel`); the stored enum value (used by the feasibility guard + CSS) is unchanged.

## Why "don't change existing sessions" is automatic

Tasks, evaluations, and their `context` (incl. localized weather/light strings) are generated once
and persisted to IndexedDB. Nothing re-translates on a locale change — the locale only affects
**new** generations and the **live UI chrome**. Changing the language therefore leaves the history
exactly as it was shot.

## Consequences

- Adding a language = add a `LocaleMeta` entry + a `Record<MessageKey, string>` dictionary
  (type-checking enforces completeness). UI reactivity is free via the settings `$state`.
- en-US/en-GB share spelling in the dictionary; only the LLM is told which English variant to spell.
- Weather/light text in a session reflects the locale active **when that session was gathered**, not
  the live locale — consistent with the "don't change existing sessions" rule.
- Unit tests (`i18n/i18n.test.ts`) cover detection, interpolation/fallback, and the weather/light/
  enum lookups.
