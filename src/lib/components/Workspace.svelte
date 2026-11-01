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
		changesInPlainWords,
		evaluate,
		settingsUsedBy,
		holdingsAt,
		isEmptyDiff,
		type BaseFlow,
		type DiagramId,
		type ViewDiff
	} from '#lib/flow/model.ts';
	import {
		change as changeSetting,
		defaultSettings,
		settingDefs,
		simpleSettingIds,
		type Reset,
		type SettingId,
		type Settings
	} from '#lib/flow/settings.ts';
	import {
		nextStep,
		previousStep,
		resolveStep,
		withDiagram,
		withSettingsHidden,
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
	import { explanationOf } from '#lib/flow/explain.ts';
	import type { ArtifactId } from '#lib/flow/vocabulary.ts';
	import type { Recording } from '#lib/recordings/format.ts';
	import {
		knownFrom,
		nearestRecordings,
		provenance,
		recordingFor,
		settingsOf
	} from '#lib/recordings/known.ts';
	import { notesFor } from '#lib/keycloak/notes.ts';
	import { sources } from '#lib/sources/sources.ts';

	interface Props {
		base: BaseFlow;
		state: AppState;
		animate?: boolean;
		/** What someone came to find out, when this came from the map. */
		question?: string | null;
		/** The question to go on to, once this flow is done. */
		onward?: { title: string; summary: string; href: string } | null;
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
		question = null,
		onward = null,
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
	const origin = $derived(provenance(base, flow, appState.settings));

	// What the last change of settings did. Stays until the visitor moves on, so it can be read.
	interface LastChange {
		diff: ViewDiff | null;
		resets: Reset[];
		elsewhere: boolean;
		setting: SettingId | null;
	}
	const NOTHING_CHANGED: LastChange = { diff: null, resets: [], elsewhere: false, setting: null };
	let last = $state.raw<LastChange>(NOTHING_CHANGED);
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
				last = NOTHING_CHANGED;
			} else if (!isEmptyDiff(diff) && animate) {
				// Opening a link also moves from the prerendered default state, but changes nothing.
				last = { ...last, diff };
			}
			previousView = nextView;
			previousStepId = stepId;
			previousDiagram = diagram;
		});
	});

	const fresh = $derived(last.diff ? freshIds(last.diff) : new Set<string>());

	const otherDiagram = $derived<DiagramId>(appState.diagram === 'flow' ? 'setup' : 'flow');
	// Going to look at the other diagram and coming back should not lose your place.
	let stepIn = $state<Record<DiagramId, string | null>>({ flow: null, setup: null });
	$effect(() => {
		stepIn[appState.diagram] = appState.step;
	});
	const hrefs = $derived({
		flow: hrefFor(withDiagram(base, appState, 'flow', stepIn.flow)),
		setup: hrefFor(withDiagram(base, appState, 'setup', stepIn.setup))
	});
	const links = $derived(
		current.links.map((link) => ({
			text: link.text,
			href: hrefFor(withDiagram(base, appState, link.diagram, link.step))
		}))
	);
	const elsewhere = $derived(
		last.elsewhere
			? {
					text: `It changes the ${otherDiagram === 'flow' ? 'user flow' : 'setup'}.`,
					href: hrefs[otherDiagram]
				}
			: null
	);

	// A switch that visibly does nothing here, because it is about the other diagram, reads as broken.
	// So someone new is only offered the ones that do something, along with any they have left on.
	const notHere = $derived(
		appState.mode === 'simple'
			? simpleSettingIds.filter((id) => {
					if (appState.settings[id] !== defaultSettings[id]) return false;
					const flipped = changeSetting(appState.settings, id, !appState.settings[id] as never);
					// One that cannot be turned on just now only says why where it could do something.
					if (flipped.settings[id] === appState.settings[id]) return !settingsUsedBy(flow).has(id);
					return (
						!changesInPlainWords(flow, appState.settings, flipped.settings) &&
						changesInPlainWords(base.diagrams[otherDiagram], appState.settings, flipped.settings)
					);
				})
			: []
	);
	const settingsElsewhere = $derived({
		text: otherDiagram === 'flow' ? 'user flow' : 'setup',
		href: hrefs[otherDiagram]
	});

	function setSetting<K extends SettingId>(id: K, value: Settings[K]) {
		const result = withSetting(base, appState, id, value);
		const other = base.diagrams[otherDiagram];
		const before = appState.settings;
		const after = result.state.settings;
		const elsewhere =
			isEmptyDiff(diffViews(evaluate(flow, before), evaluate(flow, after))) &&
			!isEmptyDiff(diffViews(evaluate(other, before), evaluate(other, after)));
		last = {
			diff: elsewhere ? null : last.diff,
			resets: result.resets,
			elsewhere,
			setting: id
		};
		onnavigate(result.state, 'push');
	}

	// What was added can be further up than fits on screen with the current step.
	function showAdded() {
		const first = last.diff?.addedSteps[0];
		if (!first) return;
		window.document
			.querySelector(`[data-step="${CSS.escape(first)}"]`)
			?.scrollIntoView({ block: 'center' });
	}

	function go(next: AppState | null) {
		if (next) onnavigate(next, 'replace');
	}

	const back = () => go(previousStep(base, appState));
	const forward = () => go(nextStep(base, appState));

	const explain = (explained: Explained | null) =>
		onnavigate(withExplained(appState, explained), 'push');
	const explanation = $derived(explanationOf(appState, view, holdings));
	// The setting an open explanation is about is where its sources should open from.
	const explainedSetting = $derived(
		appState.explained?.kind === 'setting' ? appState.explained.id : null
	);
	const intro = $derived(position === 0 ? flow.intro : null);
	const notes = $derived(
		appState.serverNotes ? notesFor(base.id, current.id, appState.settings) : []
	);

	// Raw traffic is only for advanced mode, and only what is on the wire has any.
	const onWire = $derived(
		appState.mode === 'advanced' && (current.channel === 'front' || current.channel === 'back')
	);
	// Loaded when it is first asked for, so simple mode downloads none of it.
	const wantedPreset = $derived(
		onWire ? (recordingFor(base, appState.settings)?.id ?? null) : null
	);
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
		if (!recordingFor(base, appState.settings)) return 'none';
		if (recording) return 'loaded';
		return failedPreset === wantedPreset ? 'failed' : 'loading';
	});
	const nearest = $derived(
		wireStatus === 'none'
			? nearestRecordings(base, appState.settings).map((preset) => {
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
		// A switch has no use for these keys, and keeps the focus after it is clicked.
		const typing = 'input:not([type="checkbox"]), select, textarea, [data-testid="source-panel"]';
		if (target.closest(typing)) return;
		// A presenter's clicker sends the page keys, but they should still scroll what someone is reading.
		if (event.key.startsWith('Page') && target.closest('.detail')) return;
		const move = {
			ArrowRight: forward,
			ArrowLeft: back,
			PageDown: forward,
			PageUp: back,
			Home: () => goToStep(steps[0].id),
			End: () => goToStep(steps[steps.length - 1].id)
		}[event.key];
		if (move) {
			event.preventDefault();
			move();
		}
	}
</script>

<svelte:window {onkeydown} />

<div
	class="workspace"
	class:settings-hidden={appState.settingsHidden}
	data-ready={animate}
	data-diagram={appState.diagram}
>
	<header>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the route resolves it -->
		<a class="brand" href={homeHref}>Map</a>
		<span class="slash" aria-hidden="true">/</span>
		<h1 data-testid="title">{question ?? flow.title}</h1>
		<ModeSwitch
			mode={appState.mode}
			onchange={(mode) => onnavigate(withMode(appState, mode), 'push')}
		/>
		<p class="status" data-testid="provenance">
			<span class="what">
				Prototype.
				{#if appState.mode === 'advanced'}
					{#if question}{flow.title}.{/if} Based on {origin.specs.join(', ')}.
				{/if}
				{#if origin.recorded}
					Recorded from
					{#if !appState.serverNotes}
						a real server
					{:else if appState.mode === 'simple'}
						a real server, Keycloak {origin.keycloak},
					{:else}
						Keycloak {origin.keycloak}
					{/if}
					on {origin.date}.
				{:else}
					These settings together were not recorded.
				{/if}
			</span>
			<button
				type="button"
				class="quiet"
				data-testid="server-notes-quick"
				onclick={() => onnavigate(withServerNotes(appState, !appState.serverNotes), 'push')}
			>
				{appState.serverNotes ? 'Not on Keycloak?' : 'Show the server notes'}
			</button>
		</p>
	</header>

	<p class="narrow-note" data-testid="narrow-note">
		This is made for a bigger screen. Here you can read through it step by step, without the
		diagram.
	</p>

	<aside class="settings" aria-label="Settings">
		<SettingsPanel
			settings={appState.settings}
			available={base.settings}
			mode={appState.mode}
			onchange={setSetting}
			serverNotes={appState.serverNotes}
			onservernotes={(on) => onnavigate(withServerNotes(appState, on), 'push')}
			{notHere}
			elsewhere={settingsElsewhere}
			onexplain={(id) => explain({ kind: 'setting', id })}
			onopensource={(setting, ref) => onnavigate(withSourceOpen(appState, setting, ref), 'push')}
		/>
	</aside>

	<main class="diagram">
		<div class="above">
			<DiagramSwitch current={appState.diagram} {hrefs} caption={flow.caption} />
			<button
				type="button"
				class="quiet"
				data-testid="settings-toggle"
				onclick={() =>
					onnavigate(withSettingsHidden(appState, !appState.settingsHidden), 'replace')}
			>
				{appState.settingsHidden ? 'Show settings' : 'Hide settings'}
			</button>
		</div>
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
			previousChannel={steps[position - 1]?.channel ?? null}
			atEnd={position === steps.length - 1}
			{onward}
			mapHref={homeHref}
			change={last.diff}
			resets={last.resets}
			{links}
			{elsewhere}
			changed={last.setting}
			onshowadded={showAdded}
			onexplainartifact={(id) => explain({ kind: 'artifact', id })}
			{notes}
			serverNamed={appState.serverNotes}
			known={knownFrom(base, current, appState.settings)}
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
						{notes}
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
			onwardHref={onward?.href ?? null}
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
			/ 240px minmax(0, 1fr) 330px;
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
		white-space: nowrap;
	}

	.status {
		display: flex;
		flex: 1;
		align-items: baseline;
		justify-content: flex-end;
		gap: 10px;
		min-width: 0;
		margin: 0;
		color: var(--muted);
		font-size: 12px;
	}

	/* One line, so the diagram does not lose height to it. All of it is in the source and the title. */
	.what {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.quiet {
		flex: none;
		padding: 0;
		border: 0;
		background: none;
		color: var(--muted);
		font-size: 12px;
		text-decoration: underline;
		white-space: nowrap;
	}

	.above {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-right: 12px;
	}

	.settings-hidden {
		grid-template-columns: 0 minmax(0, 1fr) 330px;
	}

	.settings-hidden .settings {
		display: none;
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

		.settings-hidden .settings {
			display: block;
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
