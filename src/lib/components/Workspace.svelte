<script lang="ts">
	import { untrack } from 'svelte';
	import Diagram from '#lib/components/Diagram.svelte';
	import SettingsPanel from '#lib/components/SettingsPanel.svelte';
	import StepControls from '#lib/components/StepControls.svelte';
	import StepDetail from '#lib/components/StepDetail.svelte';
	import { freshIds } from '#lib/diagram/fresh.ts';
	import { layoutDiagram } from '#lib/diagram/layout.ts';
	import {
		diffViews,
		evaluate,
		isEmptyDiff,
		type FlowDef,
		type ViewDiff
	} from '#lib/flow/model.ts';
	import type { Reset, SettingId, Settings } from '#lib/flow/settings.ts';
	import {
		nextStep,
		previousStep,
		visibleSteps,
		withSetting,
		withSetupOpen,
		type AppState
	} from '#lib/flow/state.ts';

	interface Props {
		flow: FlowDef;
		state: AppState;
		animate?: boolean;
		homeHref: string;
		onnavigate: (next: AppState, history: 'push' | 'replace') => void;
	}

	let { flow, state: appState, animate = true, homeHref, onnavigate }: Props = $props();

	const view = $derived(evaluate(flow, appState.settings));
	const steps = $derived(visibleSteps(view, appState.setupOpen));
	const layout = $derived(layoutDiagram(view, appState.setupOpen));
	const position = $derived(steps.findIndex((step) => step.id === appState.step));
	const current = $derived(steps[position]);

	// What the last change of settings did. Stays until the visitor moves on, so it can be read.
	let change = $state<ViewDiff | null>(null);
	let resets = $state<Reset[]>([]);
	let previousView = untrack(() => view);
	let previousStepId = untrack(() => appState.step);

	$effect.pre(() => {
		const nextView = view;
		const stepId = appState.step;
		untrack(() => {
			const diff = diffViews(previousView, nextView);
			if (!isEmptyDiff(diff)) {
				// Opening a link also moves from the prerendered default state, but changes nothing.
				if (animate) change = diff;
			} else if (stepId !== previousStepId) {
				change = null;
				resets = [];
			}
			previousView = nextView;
			previousStepId = stepId;
		});
	});

	const fresh = $derived(change ? freshIds(change) : new Set<string>());

	function setSetting<K extends SettingId>(id: K, value: Settings[K]) {
		const result = withSetting(flow, appState, id, value);
		resets = result.resets;
		onnavigate(result.state, 'push');
	}

	function go(next: AppState | null) {
		if (next) onnavigate(next, 'replace');
	}

	const back = () => go(previousStep(flow, appState));
	const forward = () => go(nextStep(flow, appState));

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

<div class="workspace" data-ready={animate}>
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
		<Diagram
			{layout}
			{animate}
			{fresh}
			currentStep={appState.step}
			onselect={(step) => onnavigate({ ...appState, step }, 'replace')}
			ontogglesetup={() => onnavigate(withSetupOpen(flow, appState, !appState.setupOpen), 'push')}
		/>
	</main>

	<aside class="detail">
		<StepDetail step={current} lifelines={view.lifelines} {change} {resets} />
	</aside>

	<footer>
		<StepControls
			position={position + 1}
			total={steps.length}
			canGoBack={previousStep(flow, appState) !== null}
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
		min-height: 0;
		min-width: 0;
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
