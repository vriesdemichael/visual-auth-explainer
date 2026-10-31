import { error } from '@sveltejs/kit';
import { flows } from '#lib/flow/index.ts';

export const entries = () => Object.keys(flows).map((flow) => ({ flow }));

export const load = ({ params }) => {
	if (!flows[params.flow]) error(404);
	return { flowId: params.flow };
};
