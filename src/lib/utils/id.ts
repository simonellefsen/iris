/** Generate a unique id. crypto.randomUUID is available in all target browsers (secure context). */
export function uid(prefix = ''): string {
	const id =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2) + Date.now().toString(36);
	return prefix ? `${prefix}_${id}` : id;
}
