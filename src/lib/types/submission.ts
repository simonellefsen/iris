export interface GpsPoint {
	lat: number;
	lon: number;
}

/** Normalized EXIF read from the original File (before any canvas/downscale op). */
export interface ExifSnapshot {
	make?: string;
	model?: string;
	lensModel?: string;
	focalLengthMm?: number;
	aperture?: number; // f-number
	exposureTimeSec?: number; // 1/250 -> 0.004
	iso?: number;
	dateTimeOriginal?: string; // ISO 8601
	gps?: GpsPoint;
	orientation?: number;
	widthPx?: number;
	heightPx?: number;
}

export type SubmissionSource = 'phone-capture' | 'file-upload';

export interface Submission {
	id: string;
	taskId: string;
	createdAt: number;
	photoBlobKey: string; // IndexedDB key in the 'photos' store
	thumbnailDataUrl?: string; // small JPEG so history renders without a blob fetch
	exif: ExifSnapshot;
	source: SubmissionSource;
	geoMismatchMeters?: number; // distance between EXIF GPS and the session location
}
