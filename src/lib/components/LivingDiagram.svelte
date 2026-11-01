<script lang="ts">
	import { untrack } from 'svelte';
	import Diagram from '#lib/components/Diagram.svelte';
	import { freshIds } from '#lib/diagram/fresh.ts';
	import { layoutDiagram } from '#lib/diagram/layout.ts';
	import { diffViews, holdingsAt } from '#lib/flow/model.ts';
	import { nodeState, nodeView, type MapNode } from '#lib/map/nodes.ts';

	interface Props {
		node: MapNode;
		/** A step to show in place of the question's own. */
		step?: string | null;
		href: string;
	}

	let { node, step = null, href }: Props = $props();

	const SAYS_WHAT_CHANGED_MS = 2600;
	let width = $state(0);
	let height = $state(0);
	let fresh = $state<ReadonlySet<string>>(new Set());
	const view = $derived(nodeView(node));
	let shown = untrack(() => view);

	$effect.pre(() => {
		if (view === shown) return;
		fresh = freshIds(diffViews(shown, view));
		shown = view;
	});

	// Nothing moves after this, so what just changed should not go on saying so.
	$effect(() => {
		if (!fresh.size) return;
		const quiet = setTimeout(() => (fresh = new Set()), SAYS_WHAT_CHANGED_MS);
		return () => clearTimeout(quiet);
	});

	const current = $derived(
		step && view.steps.some(({ id }) => id === step) ? step : nodeState(node).step
	);
	const layout = $derived(
		layoutDiagram(view, node.mode, width && height ? { width, height } : undefined)
	);
	const eyes = $derived(nodeState(node).eyes);
</script>

<section class="living" data-testid="living" data-node={node.id}>
	<!-- To look at. What can be done with it is in the link under it, and on the map beside it. -->
	<div class="picture" inert bind:clientWidth={width} bind:clientHeight={height}>
		<Diagram {layout} currentStep={current} {fresh} {eyes} holdings={holdingsAt(view, current)} />
	</div>
	<div class="words">
		<strong>{node.title}</strong>
		<p data-testid="living-answer">{node.answer}</p>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the page resolves it -->
		<a {href} data-testid="living-open">Open this question</a>
	</div>
</section>

<style>
	.living {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		border: 1px solid var(--line);
		border-radius: 10px;
		overflow: hidden;
		background: var(--bg);
	}

	.picture {
		flex: 1;
		min-height: 0;
	}

	.words {
		flex: none;
		padding: 12px 16px;
		border-top: 1px solid var(--line);
		font-size: 14px;
	}

	p {
		margin: 2px 0 6px;
		color: var(--muted);
	}
</style>
