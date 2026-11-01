import type { StepKind } from '#lib/flow/model.ts';

/**
 * Whether a party saw a step, which here means only that it was sent it or sent it itself. Not what it
 * could work out, or what anything else running there could read. Time going by is for everyone.
 */
export const sees = (step: { from: string; to: string; kind: StepKind }, party: string) =>
	step.kind === 'time' || step.from === party || step.to === party;
