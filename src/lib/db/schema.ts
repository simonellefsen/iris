import { browser } from '$app/environment';
import Dexie, { type Table } from 'dexie';
import type { CameraBody, GearProfile, Lens } from '$lib/types/gear';
import type { Task } from '$lib/types/task';
import type { Submission } from '$lib/types/submission';
import type { Evaluation } from '$lib/types/evaluation';
import type { CoachingSession } from '$lib/types/session';
import type { Settings } from '$lib/types/settings';

export const SETTINGS_KEY = 'app';
export type SettingsRecord = Settings & { id: string };

export interface PhotoBlobRecord {
	key: string;
	blob: Blob;
	createdAt: number;
}

export class IrisDB extends Dexie {
	settings!: Table<SettingsRecord, string>;
	bodies!: Table<CameraBody, string>;
	lenses!: Table<Lens, string>;
	gearProfiles!: Table<GearProfile, string>;
	tasks!: Table<Task, string>;
	submissions!: Table<Submission, string>;
	evaluations!: Table<Evaluation, string>;
	sessions!: Table<CoachingSession, string>;
	photos!: Table<PhotoBlobRecord, string>;

	constructor() {
		super('iris');
		this.version(1).stores({
			settings: '&id',
			bodies: '&id, mount, isPhone',
			lenses: '&id, mount',
			gearProfiles: '&id, bodyId',
			tasks: '&id, createdAt',
			submissions: '&id, taskId, createdAt',
			evaluations: '&id, submissionId',
			sessions: '&id, startedAt, taskId',
			photos: '&key, createdAt'
		});
	}
}

let instance: IrisDB | undefined;

/** The Dexie instance is only available in the browser (it backs onto IndexedDB). */
export function db(): IrisDB {
	if (!browser) throw new Error('Iris DB is only available in the browser');
	if (!instance) instance = new IrisDB();
	return instance;
}
