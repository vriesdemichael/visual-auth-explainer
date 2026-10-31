import type { ViewDiff } from '#lib/flow/model.ts';

/** IDs in the layout that a change added or reworded, so the diagram can point them out. */
export function freshIds(diff: ViewDiff): Set<string> {
	return new Set([
		...diff.addedSteps,
		...diff.rewordedSteps,
		...diff.addedLifelines,
		...diff.renamedLifelines,
		...diff.addedFields.map(({ step, field }) => `${step}:${field}`)
	]);
}
