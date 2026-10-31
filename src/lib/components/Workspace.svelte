<script lang="ts">
	import { untrack } from 'svelte';
	import Diagram from '#lib/components/Diagram.svelte';
	import DiagramSwitch from '#lib/components/DiagramSwitch.svelte';
	import SettingsPanel from '#lib/components/SettingsPanel.svelte';
	import StepControls from '#lib/components/StepControls.svelte';
	import StepDetail from '#lib/components/StepDetail.svelte';
	import { freshIds } from '#lib/diagram/fresh.ts';
	import { layoutDiagram } from '#lib/diagram/layout.ts';
	import {
		diffViews,
		evaluate,
		isEmptyDiff,
		type BaseFlow,
		type DiagramId,
		type ViewDiff
	} from '#lib/flow/model.ts';
	import type { Reset, SettingId, Settings } from '#lib/flow/settings.ts';
	import {
		nextStep,
		previousStep,
		withDiagram,
		withSetting,
		type AppState
	} from '#lib/flow/state.ts';

	interface Props {
		base: BaseFlow;
		state: AppState;
		animate?: boolean;
		homeHref: string;
		hrefFor: (state: AppState) => string;
		onnavigate: (next: AppState, history: 'push' | 'replace') => void;
	}

	let { base, state: appState, animate = true, homeHref, hrefFor, onnavigate }: Props = $props();

	const flow = $derived(base.diagrams[appState.diagram]);
	const view = $derived(evaluate(flow, appState.settings));
	const steps = $derived(view.steps);
	const layout = $derived(layoutDiagram(view));
	const position = $derived(steps.findIndex((step) => step.id === appState.step));
	const current = $derived(steps[position]);

	// What the last change of settings did. Stays until the visitor moves on, so it can be read.
	let change = $state<ViewDiff | null>(null);
	let resets = $state<Reset[]>([]);
	let changedElsewhere = $state(false);
	let previousView = untrack(() => view);
	let previousStepId = untrack(() => appState.step);
	let previousDiagram = untrack(() => appState.diagram);

	$effect.pre(() => {
		const nextView = view;
		const stepId = appState.step;
		const diagram = appState.diagram;
		untrack(() => {
			const diff = diffViews(previousView, nextView);
			if (diagram !== previousDiagram || (isEmptyDiff(diff) && stepId !== previousStepId)) {
				change = null;
				resets = [];
				changedElsewhere = false;
			} else if (!isEmptyDiff(diff) && animate) {
				// Opening a link also moves from the prerendered default state, but changes nothing.
				change = diff;
			}
			previousView = nextView;
			previousStepId = stepId;
			previousDiagram = diagram;
		});
	});

	const fresh = $derived(change ? freshIds(change) : new Set<string>());

	const otherDiagram = $derived<DiagramId>(appState.diagram === 'flow' ? 'setup' : 'flow');
	const hrefs = $derived({
		flow: hrefFor(withDiagram(base, appState, 'flow')),
		setup: hrefFor(withDiagram(base, appState, 'setup'))
	});
	const links = $derived(
		current.links.map((link) => ({
			text: link.text,
			href: hrefFor(withDiagram(base, appState, link.diagram, link.step))
		}))
	);
	const elsewhere = $derived(
		changedElsewhere
			? {
					text: `It changes the ${otherDiagram === 'flow' ? 'user flow' : 'setup'}.`,
					href: hrefs[otherDiagram]
				}
			: null
	);

	function setSetting<K extends SettingId>(id: K, value: Settings[K]) {
		const result = withSetting(base, appState, id, value);
		const other = base.diagrams[otherDiagram];
		const before = appState.settings;
		const after = result.state.settings;
		resets = result.resets;
		changedElsewhere =
			isEmptyDiff(diffViews(evaluate(flow, before), evaluate(flow, after))) &&
			!isEmptyDiff(diffViews(evaluate(other, before), evaluate(other, after)));
		if (changedElsewhere) change = null;
		onnavigate(result.state, 'push');
	}

	function go(next: AppState | null) {
		if (next) onnavigate(next, 'replace');
	}

	const back = () => go(previousStep(base, appState));
	const forward = () => go(nextStep(base, appState));

	function onkeydown(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		const target = event.target as HTMLElement;
		if (target.closest('input, select, textarea')) return;
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			forward();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			back();
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="workspace" data-ready={animate} data-diagram={appState.diagram}>
	<header>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the route resolves it -->
		<a href={homeHref}>Start</a>
		<h1>{flow.title}</h1>
		<p class="status">
			Step 0 prototype. Most message shapes are not yet checked on a real server.
		</p>
	</header>

	<aside class="settings">
		<SettingsPanel settings={appState.settings} onchange={setSetting} />
	</aside>

	<main class="diagram">
		<DiagramSwitch current={appState.diagram} {hrefs} />
		<div class="canvas">
			<!-- Two diagrams, not two states of one, so switching does not animate. -->
			{#key appState.diagram}
				<Diagram
					{layout}
					{animate}
					{fresh}
					currentStep={appState.step}
					onselect={(step) => onnavigate({ ...appState, step }, 'replace')}
				/>
			{/key}
		</div>
	</main>

	<aside class="detail">
		<StepDetail step={current} lifelines={view.lifelines} {change} {resets} {links} {elsewhere} />
	</aside>

	<footer>
		<StepControls
			position={position + 1}
			total={steps.length}
			canGoBack={previousStep(base, appState) !== null}
			onback={back}
			onnext={forward}
		/>
	</footer>
</div>

<style>
	.workspace {
		display: grid;
		grid-template:
			'header header header' auto
			'settings diagram detail' minmax(0, 1fr)
			'settings controls detail' auto
			/ 250px minmax(0, 1fr) 330px;
		height: 100dvh;
	}

	header {
		grid-area: header;
		display: flex;
		align-items: baseline;
		gap: 16px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--line);
	}

	h1 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.status {
		margin: 0 0 0 auto;
		color: var(--muted);
		font-size: 12px;
	}

	.settings {
		grid-area: settings;
		overflow-y: auto;
		border-right: 1px solid var(--line);
		padding: 14px 16px;
	}

	.diagram {
		grid-area: diagram;
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
	}

	.canvas {
		flex: 1;
		min-height: 0;
	}

	.detail {
		grid-area: detail;
		overflow-y: auto;
		border-left: 1px solid var(--line);
		padding: 14px 16px;
	}

	footer {
		grid-area: controls;
		border-top: 1px solid var(--line);
		padding: 8px 16px;
	}
</style>
