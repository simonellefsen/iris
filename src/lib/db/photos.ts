import { db } from './schema';
import { uid } from '$lib/utils/id';

/** Store a photo Blob and return the key under which it was saved. */
export async function putPhoto(blob: Blob): Promise<string> {
	const key = uid('photo');
	await db().photos.put({ key, blob, createdAt: Date.now() });
	return key;
}

export async function getPhoto(key: string): Promise<Blob | undefined> {
	const rec = await db().photos.get(key);
	return rec?.blob;
}

export async function deletePhoto(key: string): Promise<void> {
	await db().photos.delete(key);
}

/**
 * Drop photo Blobs older than `days` while keeping their metadata + thumbnails so
 * history still renders. Returns the number of Blobs removed. Helps stay within
 * iOS IndexedDB eviction limits.
 */
export async function freeSpaceOlderThan(days: number): Promise<number> {
	const cutoff = Date.now() - days * 86_400_000;
	const stale = await db().photos.where('createdAt').below(cutoff).primaryKeys();
	await db().photos.bulkDelete(stale);
	return stale.length;
}
