import { pickImageViaInput, type PickOutcome } from './filepick';

/**
 * Open the device camera (phone mode). Uses `<input type="file" capture="environment">`,
 * the most robust cross-platform capture path (iOS Safari, Android Chrome, desktop falls
 * back to a file picker).
 */
export function capturePhoto(): Promise<PickOutcome> {
	return pickImageViaInput({ capture: 'environment' });
}
