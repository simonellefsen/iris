import type { ActiveRig, CameraBody, Lens } from '$lib/types/gear';
import type { Task } from '$lib/types/task';
import { maxApertureAt, round2 } from '$lib/utils/aperture';
import { equivFocal, formatShutter, minHandheldShutterSec } from '$lib/utils/focal';

export interface RigCapabilities {
	body: CameraBody;
	lens?: Lens;
	focalRangeMm: { min: number; max: number };
	cropFactor: number;
	hasStabilization: boolean;
	/** Widest aperture available across the focal range (lowest f-number). */
	fastestAperture: number | undefined;
	maxApertureAt(fl: number): number | undefined;
}

export function rigCapabilities(body: CameraBody, lens?: Lens): RigCapabilities {
	const fl = lens?.focalLengthMm ?? { min: 24, max: 24 };
	const steps = lens?.maxAperture ?? [];
	const fastest = steps.length ? Math.min(...steps.map((s) => s.maxAperture)) : undefined;
	return {
		body,
		lens,
		focalRangeMm: fl,
		cropFactor: body.cropFactor,
		hasStabilization: body.hasIBIS || (lens?.hasOIS ?? false),
		fastestAperture: fastest,
		maxApertureAt: (f) => maxApertureAt(steps, f)
	};
}

function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

function focalForShutter(task: Task, cap: RigCapabilities): number {
	const t = task.constraints.focalLengthTarget;
	if (typeof t === 'number') return t;
	if (t && typeof t === 'object') return t.max;
	return cap.focalRangeMm.max;
}

/**
 * Clamp a task's numeric constraints so they are physically achievable with the rig:
 * focal length within the lens range, aperture no wider than the lens allows at that FL,
 * and a handheld shutter floor derived from the reciprocal-focal rule.
 */
export function enforceFeasibility(task: Task, cap: RigCapabilities): Task {
	const constraints = { ...task.constraints };

	if (constraints.focalLengthTarget != null) {
		const t = constraints.focalLengthTarget;
		if (typeof t === 'number') {
			constraints.focalLengthTarget = clamp(t, cap.focalRangeMm.min, cap.focalRangeMm.max);
		} else {
			constraints.focalLengthTarget = {
				min: clamp(t.min, cap.focalRangeMm.min, cap.focalRangeMm.max),
				max: clamp(t.max, cap.focalRangeMm.min, cap.focalRangeMm.max)
			};
		}
	}

	const targetFl =
		typeof constraints.focalLengthTarget === 'number'
			? constraints.focalLengthTarget
			: cap.focalRangeMm.min;

	if (constraints.apertureTarget != null) {
		const limit = cap.maxApertureAt(targetFl) ?? cap.fastestAperture;
		if (limit != null && constraints.apertureTarget < limit) {
			constraints.apertureTarget = round2(limit);
		}
	}

	const eq = equivFocal(focalForShutter({ ...task, constraints }, cap), cap.cropFactor);
	constraints.minShutterForHandheld = formatShutter(minHandheldShutterSec(eq, cap.hasStabilization));

	// Also keep the suggested exposure's aperture achievable.
	const suggested = { ...task.suggestedExposure };
	if (suggested.aperture != null) {
		const limit = cap.maxApertureAt(targetFl) ?? cap.fastestAperture;
		if (limit != null && suggested.aperture < limit) suggested.aperture = round2(limit);
	}

	return { ...task, constraints, suggestedExposure: suggested };
}

/** Resolve an ActiveRig into its body + lens (lens undefined for a phone-fixed body). */
export async function resolveRig(
	rig: ActiveRig,
	getBody: (id: string) => Promise<CameraBody | undefined>,
	getLens: (id: string) => Promise<Lens | undefined>
): Promise<{ body: CameraBody; lens?: Lens }> {
	const body = await getBody(rig.bodyId);
	if (!body) throw new Error(`Unknown camera body: ${rig.bodyId}`);
	const lens = rig.lensId ? await getLens(rig.lensId) : undefined;
	return { body, lens };
}
