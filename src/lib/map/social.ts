import { nodeView, type MapNode } from '#lib/map/nodes.ts';

/** What the image for a shared link shows, so a test can tell when one has gone out of date. */
export function socialKey(node: MapNode): string {
	const view = nodeView(node);
	return `${node.title}|${node.summary}|${view.steps.length}|${view.lifelines.length}`;
}
