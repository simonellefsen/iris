import { isAcceptedImage, isRawFilename } from './exif';

export interface PickOutcome {
	file?: File;
	error?: string;
}

/**
 * Open a file picker. Resolves with the chosen file, undefined on cancel, or an error
 * message if the picked file isn't an accepted image (or is a RAW file).
 */
export function pickImageViaInput(options: { capture?: 'environment' | 'user' } = {}): Promise<PickOutcome> {
	return new Promise((resolve) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		if (options.capture) input.setAttribute('capture', options.capture);

		let settled = false;
		const finish = (outcome: PickOutcome) => {
			if (settled) return;
			settled = true;
			window.removeEventListener('focus', onFocus);
			resolve(outcome);
		};
		const onFocus = () => {
			// User returned to the page without selecting -> treat as cancel.
			setTimeout(() => finish({}), 350);
		};

		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return finish({});
			if (isRawFilename(file.name)) {
				return finish({ error: 'RAW files (.cr2/.nef/etc.) are not supported. Please upload a JPEG or HEIC.' });
			}
			if (!isAcceptedImage(file)) {
				return finish({ error: 'Please choose a JPEG, PNG, WebP, or HEIC image.' });
			}
			finish({ file });
		};

		window.addEventListener('focus', onFocus);
		input.click();
	});
}

/** Accept files dragged onto an element. Returns the first accepted image, or an error. */
export function readDroppedFiles(dataTransfer: DataTransfer): PickOutcome {
	const file = dataTransfer.files?.[0];
	if (!file) return { error: 'No file dropped.' };
	if (isRawFilename(file.name)) {
		return { error: 'RAW files are not supported. Please drop a JPEG or HEIC.' };
	}
	if (!isAcceptedImage(file)) return { error: 'Please drop a JPEG, PNG, WebP, or HEIC image.' };
	return { file };
}
