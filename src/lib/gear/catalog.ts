import catalogData from './catalog.json';
import { db } from '$lib/db/schema';
import type { CameraBody, Lens } from '$lib/types/gear';

export const CATALOG_BODIES = catalogData.bodies as CameraBody[];
export const CATALOG_LENSES = catalogData.lenses as Lens[];

/** Seed the curated catalog into IndexedDB on first run. Idempotent. */
export async function seedCatalogIfEmpty(): Promise<void> {
	const count = await db().bodies.count();
	if (count > 0) return;
	await db().bodies.bulkPut(CATALOG_BODIES);
	await db().lenses.bulkPut(CATALOG_LENSES);
}

/**
 * Corrections to already-seeded catalog rows on existing installs (seeding is skipped once
 * data exists). Only touches rows still untouched by the user (source === 'catalog'). Ids stay
 * stable. Generalise the iPhone seed — we can't know the exact model until a capture's EXIF.
 */
export async function migrateCatalog(): Promise<void> {
	const phone = await db().bodies.get('body_iphone_15_pro');
	if (phone?.source === 'catalog' && phone.model === 'iPhone 15 Pro') {
		await db().bodies.update(phone.id, { model: 'iPhone' });
	}
	const phoneLens = await db().lenses.get('lens_iphone_15_pro_main');
	if (phoneLens?.source === 'catalog' && phoneLens.model === 'iPhone 15 Pro main (35mm-equiv)') {
		await db().lenses.update(phoneLens.id, { model: 'iPhone main (35mm-equiv)' });
	}
}

export async function allBodies(): Promise<CameraBody[]> {
	return db().bodies.toArray();
}

export async function allLenses(): Promise<Lens[]> {
	return db().lenses.toArray();
}

export async function lensesForMount(mount: string): Promise<Lens[]> {
	return db().lenses.where('mount').equals(mount).toArray();
}

export async function getBody(id: string): Promise<CameraBody | undefined> {
	return db().bodies.get(id);
}

export async function getLens(id: string): Promise<Lens | undefined> {
	return db().lenses.get(id);
}
