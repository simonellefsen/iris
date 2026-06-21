/**
 * Decode + downscale an image to a JPEG suitable for vision models, and produce a
 * small thumbnail data URL for history lists. Canvas re-encoding strips EXIF, so
 * callers must parse EXIF from the original File first (see exif.ts).
 *
 * Limits: OpenAI useful <= ~2048px longest side; Anthropic 5 MB base64; base64 is +33%.
 * We target 1568px longest side @ q0.82 (~150-400 KB) to stay comfortably under all.
 */

const MAX_LONG_SIDE = 1568;
const THUMB_SIDE = 320;
const QUALITY = 0.82;

export interface DownscaledImage {
	blob: Blob;
	base64: string;
	width: number;
	height: number;
	mediaType: 'image/jpeg';
}

type Decoded = ImageBitmap | HTMLImageElement;

async function decode(file: Blob): Promise<Decoded> {
	if (typeof createImageBitmap === 'function') {
		try {
			return await createImageBitmap(file);
		} catch {
			/* fall back to <img> (Safari handles HEIC here) */
		}
	}
	return await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Could not decode the image (RAW files are not supported in-browser).'));
		};
		img.src = url;
	});
}

function drawScaled(
	src: Decoded,
	maxLongSide: number,
	maxShortSide?: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
	const iw = 'width' in src ? src.width : (src as ImageBitmap).width;
	const ih = 'height' in src ? src.height : (src as ImageBitmap).height;
	const scale = Math.min(
		1,
		maxLongSide / Math.max(iw, ih),
		...(maxShortSide ? [maxShortSide / Math.min(iw, ih)] : [])
	);
	const width = Math.max(1, Math.round(iw * scale));
	const height = Math.max(1, Math.round(ih * scale));
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D context unavailable.');
	ctx.drawImage(src, 0, 0, width, height);
	return { canvas, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error('Failed to encode JPEG.'))),
			'image/jpeg',
			quality
		);
	});
}

export async function blobToBase64(blob: Blob): Promise<string> {
	const buf = await blob.arrayBuffer();
	const bytes = new Uint8Array(buf);
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

export async function downscaleToJpeg(file: File | Blob): Promise<DownscaledImage> {
	const src = await decode(file);
	try {
		const { canvas, width, height } = drawScaled(src, MAX_LONG_SIDE);
		const blob = await canvasToBlob(canvas, QUALITY);
		const base64 = await blobToBase64(blob);
		return { blob, base64, width, height, mediaType: 'image/jpeg' };
	} finally {
		if ('close' in src && typeof (src as ImageBitmap).close === 'function') {
			(src as ImageBitmap).close();
		}
	}
}

/** Small JPEG data URL for the history list (keeps queries cheap — no blob fetch). */
export async function makeThumbnailDataUrl(file: File | Blob, side = THUMB_SIDE): Promise<string> {
	const src = await decode(file);
	try {
		const { canvas } = drawScaled(src, side, side);
		return canvas.toDataURL('image/jpeg', 0.7);
	} finally {
		if ('close' in src && typeof (src as ImageBitmap).close === 'function') {
			(src as ImageBitmap).close();
		}
	}
}
