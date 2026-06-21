import { liveQuery } from 'dexie';

/**
 * Bridge Dexie's liveQuery to Svelte 5 runes. Call from a component's top-level
 * script. The query auto re-runs when the underlying tables change; pass `deps`
 * to also re-run when captured reactive values change.
 *
 *   const items = useLiveQuery(() => db().sessions.toArray());
 *   // in markup: {items.value?.length}  (undefined while loading)
 */
export function useLiveQuery<T>(
	querier: () => Promise<T> | T,
	deps?: () => unknown
) {
	let value = $state<T | undefined>(undefined);
	let error = $state<unknown>(undefined);
	let loading = $state(true);

	$effect(() => {
		// Track any reactive deps so the query re-subscribes when they change.
		deps?.();
		loading = true;
		const sub = liveQuery(querier).subscribe({
			next: (v) => {
				value = v;
				loading = false;
			},
			error: (e) => {
				error = e;
				loading = false;
			}
		});
		return () => sub.unsubscribe();
	});

	return {
		get value() {
			return value;
		},
		get error() {
			return error;
		},
		get loading() {
			return loading;
		}
	};
}
