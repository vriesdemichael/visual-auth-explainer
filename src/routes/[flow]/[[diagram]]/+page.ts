import { error } from '@sveltejs/kit';
import { flows } from '#lib/flow/index.ts';
import type { DiagramId } from '#lib/flow/model.ts';

export const entries = () =>
	Object.keys(flows).flatMap((flow) => [{ flow }, { flow, diagram: 'setup' }]);

export const load = ({ params }) => {
	if (!flows[params.flow]) error(404);
	if (params.diagram && params.diagram !== 'setup') error(404);
	const diagram: DiagramId = params.diagram ? 'setup' : 'flow';
	return { flowId: params.flow, diagram };
};
