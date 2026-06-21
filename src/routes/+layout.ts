// SPA mode: the whole app is client-side (BYOK LLM keys, IndexedDB, geolocation,
// camera). No SSR, no prerendering of pages — adapter-static emits a fallback index.html.
export const ssr = false;
export const prerender = false;
export const trailingSlash = 'ignore';
