import type { ProviderKey } from '$lib/types/settings';
import type { ValidationResult } from './provider';
import { getProvider } from './registry';

/** Probe a provider's API key with a cheap authenticated request. */
export async function validateProvider(key: ProviderKey): Promise<ValidationResult> {
	return getProvider(key).validateKey();
}
