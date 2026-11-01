<script lang="ts">
	import { tick, untrack } from 'svelte';
	import ChannelLegend from '#lib/components/ChannelLegend.svelte';
	import Diagram from '#lib/components/Diagram.svelte';
	import DiagramSwitch from '#lib/components/DiagramSwitch.svelte';
	import Explanation from '#lib/components/Explanation.svelte';
	import ModeSwitch from '#lib/components/ModeSwitch.svelte';
	import OnTheWire from '#lib/components/OnTheWire.svelte';
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
		resolveStep,
		withDiagram,
		withExplained,
		withMode,
		withServerNotes,
		withSetting,
		withSourceClosed,
		withSourceOpen,
		withSourceSection,
		type AppState,
		type Explained
	} from '#lib/flow/state.ts';
	import { artifacts, type ArtifactId } from '#lib/flow/vocabulary.ts';
	import type { Recording } from '#lib/recordings/format.ts';
	import {
		nearestRecordings,
		provenance,
		recordingFor,
		settingsOf
	} from '#lib/recordings/known.ts';
	import { notesFor } from '#lib/keycloak/notes.ts';
	import { isVendorSource, sources } from '#lib/sources/sources.ts';

	interface Props {
		base: BaseFlow;
		state: AppState;
		animate?: boolean;
		homeHref: string;
		hrefFor: (state: AppState) => string;
		loadText: (file: string) => Promise<string>;
		loadRecording: (preset: string) => Promise<Recording>;
		onnavigate: (next: AppState, history: 'push' | 'replace') => void;
	}

	let {
		base,
		state: appState,
		animate = true,
		homeHref,
		hrefFor,
		loadText,
		loadRecording,
		onnavigate
	}: Props = $props();

	const flow = $derived(base.diagrams[appState.diagram]);
	const view = $derived(evaluate(flow, appState.settings));
	const steps = $derived(view.steps);
	const layout = $derived(layoutDiagram(view, appState.mode));
	const position = $derived(steps.findIndex((step) => step.id === appState.step));
	const current = $derived(steps[position]);
	const holdings = $derived(holdingsAt(view, appState.step));
	const channelsHere = $derived([...new Set(steps.map((step) => step.channel))]);
	const origin = $derived(provenance(flow, appState.settings));

	// What the last change of settings did. Stays until the visitor moves on, so it can be read.
	let change = $state<ViewDiff | null>(null);
	let resets = $state<Reset[]>([]);
	let changedElsewhere = $state(false);
	let changedSetting = $state<SettingId | null>(null);
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
				changedSetting = null;
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
		changedSetting = id;
		onnavigate(result.state, 'push');
	}

	function go(next: AppState | null) {
		if (next) onnavigate(next, 'replace');
	}

	const back = () => go(previousStep(base, appState));
	const forward = () => go(nextStep(base, appState));

	const explain = (explained: Explained | null) =>
		onnavigate(withExplained(appState, explained), 'push');
	const nameOf = (id: string) => {
		const line = view.lifelines.find((candidate) => candidate.id === id);
		return (appState.mode === 'simple' ? line?.plainName : line?.name) ?? id;
	};
	const explanation = $derived.by(() => {
		const explained = appState.explained;
		if (explained?.kind === 'lifeline') {
			const line = view.lifelines.find((candidate) => candidate.id === explained.id);
			if (!line) return null;
			return {
				title: nameOf(line.id),
				text: line.concept,
				seen: holdings[line.id] ?? []
			};
		}
		if (explained?.kind === 'artifact') {
			return {
				title: artifacts[explained.id].label,
				text: artifacts[explained.id].explains,
				seenBy: view.lifelines
					.filter((line) => holdings[line.id]?.includes(explained.id))
					.map((line) => nameOf(line.id))
			};
		}
		if (explained?.kind === 'setting') {
			const def = settingDefs[explained.id];
			return {
				title: appState.mode === 'simple' ? (def.simple?.label ?? def.label) : def.label,
				text: def.why,
				sources: def.sources.filter((ref) => appState.serverNotes || !isVendorSource(ref.source))
			};
		}
		return null;
	});
	// The setting an open explanation is about is where its sources should open from.
	const explainedSetting = $derived(
		appState.explained?.kind === 'setting' ? appState.explained.id : null
	);
	const intro = $derived(position === 0 ? flow.intro : null);

	// Raw traffic is only for advanced mode, and only what is on the wire has any.
	const onWire = $derived(
		appState.mode === 'advanced' && (current.channel === 'front' || current.channel === 'back')
	);
	// Loaded when it is first asked for, so simple mode downloads none of it.
	const wantedPreset = $derived(onWire ? (recordingFor(appState.settings)?.id ?? null) : null);
	let loaded = $state.raw<Recording | null>(null);
	let failedPreset = $state<string | null>(null);
	$effect(() => {
		const preset = wantedPreset;
		if (!preset || untrack(() => loaded?.preset) === preset) return;
		let stale = false;
		loadRecording(preset).then(
			(recording) => {
				if (!stale) loaded = recording;
			},
			() => {
				if (!stale) failedPreset = preset;
			}
		);
		return () => {
			stale = true;
		};
	});
	const recording = $derived(loaded?.preset === wantedPreset ? loaded : null);
	const wireStatus = $derived.by(() => {
		if (!recordingFor(appState.settings)) return 'none';
		if (recording) return 'loaded';
		return failedPreset === wantedPreset ? 'failed' : 'loading';
	});
	const nearest = $derived(
		wireStatus === 'none'
			? nearestRecordings(appState.settings).map((preset) => {
					const settings = settingsOf(preset);
					const step = resolveStep(flow, evaluate(flow, settings), appState.step);
					return { text: preset.title, href: hrefFor({ ...appState, settings, step }) };
				})
			: []
	);
	// Only what can really be replayed: with no recording, or nothing recorded here, it would be a lie.
	const answer = $derived(
		recording?.messages.some((message) => message.step === current.id) ? current.execute : undefined
	);
	const numberOf = (id: string) => {
		const at = steps.findIndex((step) => step.id === id);
		return at < 0 ? null : at + 1;
	};
	const goToStep = (step: string) => {
		if (numberOf(step) !== null) onnavigate({ ...appState, step }, 'replace');
	};

	// The answer stays marked until someone moves on. A link to the step just shows the step.
	let executed = $state<{ from: string; to: string } | null>(null);
	const answerTo = $derived(executed?.to === appState.step ? executed.from : null);
	function execute() {
		if (!answer) return;
		executed = { from: appState.step, to: answer };
		goToStep(answer);
		// The button is gone now, and what came back is what to read next.
		tick().then(() =>
			window.document.querySelector<HTMLElement>('[data-testid="payload"]')?.focus()
		);
	}

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
		if (event.key === 'Escape' && appState.explained) {
			explain(null);
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
		<a class="brand" href={homeHref}>Map</a>
		<span class="slash" aria-hidden="true">/</span>
		<h1>{flow.title}</h1>
		<ModeSwitch
			mode={appState.mode}
			onchange={(mode) => onnavigate(withMode(appState, mode), 'push')}
		/>
		<p class="status" data-testid="provenance">
			Prototype. Based on {origin.specs.join(', ')}. Recorded from
			{appState.serverNotes ? `Keycloak ${origin.keycloak}` : 'a real server'} on
			{origin.date}.
		</p>
	</header>

	<p class="narrow-note" data-testid="narrow-note">
		This is made for a bigger screen. Here you can read through it step by step, without the
		diagram.
	</p>

	<aside class="settings" aria-label="Settings">
		<SettingsPanel
			settings={appState.settings}
			mode={appState.mode}
			onchange={setSetting}
			serverNotes={appState.serverNotes}
			onservernotes={(on) => onnavigate(withServerNotes(appState, on), 'push')}
			onexplain={(id) => explain({ kind: 'setting', id })}
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
					onexplainlifeline={(id) => explain({ kind: 'lifeline', id })}
					onexplainartifact={(id: ArtifactId) => explain({ kind: 'artifact', id })}
					onselect={(step) => onnavigate({ ...appState, step }, 'replace')}
				/>
			{/key}
		</div>
		<ChannelLegend present={channelsHere} />
	</main>

	<aside class="detail" aria-label="The current step">
		{#if explanation}
			<Explanation
				{...explanation}
				onclose={() => explain(null)}
				onexplainartifact={(id) => explain({ kind: 'artifact', id })}
				onopensource={(ref) => {
					if (explainedSetting) onnavigate(withSourceOpen(appState, explainedSetting, ref), 'push');
				}}
			/>
		{/if}
		<StepDetail
			step={current}
			lifelines={view.lifelines}
			mode={appState.mode}
			{intro}
			{change}
			{resets}
			{links}
			{elsewhere}
			changed={changedSetting}
			onexplainartifact={(id) => explain({ kind: 'artifact', id })}
			notes={appState.serverNotes ? notesFor(current.id, appState.settings) : []}
			serverNamed={appState.serverNotes}
		>
			{#snippet wire()}
				{#if onWire}
					<OnTheWire
						step={current}
						{recording}
						status={wireStatus}
						{nearest}
						{answerTo}
						{numberOf}
						onstep={goToStep}
						serverNamed={appState.serverNotes}
					/>
				{/if}
			{/snippet}
		</StepDetail>
	</aside>

	<footer>
		<StepControls
			position={position + 1}
			total={steps.length}
			canGoBack={previousStep(base, appState) !== null}
			onback={back}
			onnext={forward}
			answerAt={answer ? numberOf(answer) : null}
			onexecute={execute}
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
		text-align: right;
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

	.narrow-note {
		display: none;
	}

	/* Everything to read, on a screen too small for the diagram (ADR-008). */
	@media (max-width: 767px) {
		.workspace {
			display: flex;
			flex-direction: column;
			height: auto;
			min-height: 100dvh;
		}

		header {
			flex-wrap: wrap;
		}

		.status,
		.diagram {
			display: none;
		}

		.narrow-note {
			display: block;
			margin: 0;
			padding: 10px 16px;
			background: var(--panel);
			font-size: 13px;
		}

		.detail {
			order: 1;
			border-left: 0;
			overflow-y: visible;
		}

		footer {
			order: 2;
			position: sticky;
			bottom: 0;
			background: var(--bg);
		}

		.settings {
			order: 3;
			border-right: 0;
			border-top: 1px solid var(--line);
			overflow-y: visible;
		}

		.source,
		.source.wide {
			position: fixed;
			inset: 0;
			width: 100%;
		}
	}

	/* The diagram and its words, as much paper as that takes. */
	@media print {
		.workspace {
			display: block;
			height: auto;
		}

		.settings,
		footer,
		.source,
		.narrow-note {
			display: none;
		}

		.detail {
			border: 0;
			overflow: visible;
		}

		.diagram {
			display: block;
		}
	}
</style>
