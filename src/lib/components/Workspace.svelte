<script lang="ts">
	import { tick, untrack } from 'svelte';
	import ChannelLegend from '#lib/components/ChannelLegend.svelte';
	import Diagram from '#lib/components/Diagram.svelte';
	import DiagramSwitch from '#lib/components/DiagramSwitch.svelte';
	import SettingsPanel from '#lib/components/SettingsPanel.svelte';
	import SourcePanel from '#lib/components/SourcePanel.svelte';
	import StepControls from '#lib/components/StepControls.svelte';
	import StepDetail from '#lib/components/StepDetail.svelte';
	import { freshIds } from '#lib/diagram/fresh.ts';
	import { layoutDiagram } from '#lib/diagram/layout.ts';
	import {
		diffViews,
		evaluate,
		holdingsAt,
		isEmptyDiff,
		type BaseFlow,
		type DiagramId,
		type ViewDiff
	} from '#lib/flow/model.ts';
	import { settingDefs, type Reset, type SettingId, type Settings } from '#lib/flow/settings.ts';
	import {
		nextStep,
		previousStep,
		withDiagram,
		withSetting,
		withSourceClosed,
		withSourceOpen,
		withSourceSection,
		type AppState
	} from '#lib/flow/state.ts';
	import { provenance } from '#lib/recordings/known.ts';
	import { sources } from '#lib/sources/sources.ts';

	interface Props {
		base: BaseFlow;
		state: AppState;
		animate?: boolean;
		homeHref: string;
		hrefFor: (state: AppState) => string;
		loadText: (file: string) => Promise<string>;
		onnavigate: (next: AppState, history: 'push' | 'replace') => void;
	}

	let {
		base,
		state: appState,
		animate = true,
		homeHref,
		hrefFor,
		loadText,
		onnavigate
	}: Props = $props();

	const flow = $derived(base.diagrams[appState.diagram]);
	const view = $derived(evaluate(flow, appState.settings));
	const steps = $derived(view.steps);
	const layout = $derived(layoutDiagram(view));
	const position = $derived(steps.findIndex((step) => step.id === appState.step));
	const current = $derived(steps[position]);
	const holdings = $derived(holdingsAt(view, appState.step));
	const channelsHere = $derived([...new Set(steps.map((step) => step.channel))]);
	const origin = $derived(provenance(flow, appState.settings));

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

	const openSource = $derived(appState.source);
	const openWhy = $derived(
		openSource
			? settingDefs[openSource.setting].sources.find((ref) => ref.source === openSource.id)?.why
			: undefined
	);
	const closeSource = () => onnavigate(withSourceClosed(appState), 'push');

	// Back to the source that opened it, however it closed, so a keyboard user keeps their place.
	let lastSource = untrack(() => appState.source);
	$effect(() => {
		const source = appState.source;
		untrack(() => {
			if (lastSource && !source) {
				const opener = `[data-source-ref="${lastSource.setting}:${lastSource.id}"]`;
				tick().then(() => window.document.querySelector<HTMLElement>(opener)?.focus());
			}
			lastSource = source;
		});
	});

	function onkeydown(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'Escape' && appState.source) {
			closeSource();
			return;
		}
		const target = event.target as HTMLElement;
		if (target.closest('input, select, textarea, [data-testid="source-panel"]')) return;
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
		<a class="brand" href={homeHref}>Visual auth explainer</a>
		<span class="slash" aria-hidden="true">/</span>
		<h1>{flow.title}</h1>
		<p class="status" data-testid="provenance">
			Prototype. Based on {origin.specs.join(', ')}. Recorded from Keycloak {origin.keycloak} on
			{origin.date}.
		</p>
	</header>

	<aside class="settings" aria-label="Settings">
		<SettingsPanel
			settings={appState.settings}
			onchange={setSetting}
			onopensource={(setting, ref) => onnavigate(withSourceOpen(appState, setting, ref), 'push')}
		/>
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
					{holdings}
					currentStep={appState.step}
					onselect={(step) => onnavigate({ ...appState, step }, 'replace')}
				/>
			{/key}
		</div>
		<ChannelLegend present={channelsHere} />
	</main>

	<aside class="detail" aria-label="The current step">
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

	{#if openSource && openWhy}
		<div class="source" class:wide={sources[openSource.id].textFile}>
			{#key `${openSource.setting}:${openSource.id}`}
				<SourcePanel
					source={sources[openSource.id]}
					why={openWhy}
					section={openSource.section}
					{loadText}
					onsection={(section) => onnavigate(withSourceSection(appState, section), 'replace')}
					onclose={closeSource}
				/>
			{/key}
		</div>
	{/if}
</div>

<style>
	.workspace {
		display: grid;
		grid-template:
			'header header header' auto
			'settings diagram detail' minmax(0, 1fr)
			'settings controls detail' auto
			/ 256px minmax(0, 1fr) 340px;
		height: 100dvh;
	}

	header {
		grid-area: header;
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--line);
	}

	.brand {
		color: var(--muted);
		font-weight: 500;
		text-decoration: none;
	}

	.brand:hover {
		color: var(--fg);
	}

	.slash {
		color: var(--strong-line);
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

	/* Over the step detail, so the diagram stays put. An RFC's lines need a little more room. */
	.source {
		grid-row: 2 / 4;
		grid-column: 2 / 4;
		justify-self: end;
		z-index: 2;
		width: 340px;
		overflow-y: auto;
		background: var(--bg);
		border-left: 1px solid var(--line);
		box-shadow: -8px 0 24px rgb(0 0 0 / 0.12);
	}

	.source.wide {
		width: min(570px, 100%);
	}
</style>
