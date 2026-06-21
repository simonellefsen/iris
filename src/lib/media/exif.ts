import exifr from 'exifr';
import type { ExifSnapshot } from '$lib/types/submission';
import { round2 } from '$lib/utils/aperture';

/** RAW files we won't accept (vision models can't ingest them and browsers can't decode them). */
const RAW_EXT = /\.(cr2|cr3|nef|arw|raf|orf|rw2|pef|dng|srw|3fr|iiq|raw)$/i;

export function isRawFilename(name: string): boolean {
	return RAW_EXT.test(name);
}

export function isAcceptedImage(file: File): boolean {
	return (
		/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.type) ||
		/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
	);
}

async function safeParse(file: Blob) {
	// tiff block covers Make/Model/ImageWidth/Height (IFD0); exif covers exposure/lens; gps for lat/lon.
	const opts = { tiff: true, exif: true, gps: true };
	try {
		return await exifr.parse(file, opts);
	} catch {
		try {
			return await exifr.parse(file, { tiff: true, exif: true });
		} catch {
			return {};
		}
	}
}

/**
 * Parse EXIF from the ORIGINAL file. Must run before any canvas/downscale op,
 * because canvas re-encoding strips EXIF.
 */
export async function parseExif(file: File | Blob): Promise<ExifSnapshot> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const raw: Record<string, any> = (await safeParse(file)) ?? {};

	const iso = raw.ISO ?? raw.ISOSpeedRatings;
	const fnumber = raw.FNumber;
	const fl = raw.FocalLength;
	const fl35 = raw.FocalLengthIn35mmFormat;
	const gps =
		raw.latitude != null && raw.longitude != null
			? { lat: raw.latitude, lon: raw.longitude }
			: undefined;
	const dto = raw.DateTimeOriginal ?? raw.CreateDate ?? raw.DateTime;

	return {
		make: raw.Make,
		model: raw.Model,
		lensModel: raw.LensModel,
		focalLengthMm: fl35 ?? fl,
		aperture: typeof fnumber === 'number' ? round2(fnumber) : undefined,
		exposureTimeSec: typeof raw.ExposureTime === 'number' ? raw.ExposureTime : undefined,
		iso: typeof iso === 'number' ? iso : undefined,
		dateTimeOriginal: dto ? new Date(dto).toISOString() : undefined,
		gps,
		widthPx: raw.ImageWidth ?? raw.ExifImageWidth,
		heightPx: raw.ImageHeight ?? raw.ExifImageHeight
	};
}
