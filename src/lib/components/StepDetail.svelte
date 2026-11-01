<script lang="ts">
	import type { Lifeline, Step, ViewDiff } from '#lib/flow/model.ts';
	import { settingDefs, type Reset, type SettingId } from '#lib/flow/settings.ts';
	import { artifacts, channels, type ArtifactId, type Mode } from '#lib/flow/vocabulary.ts';
	import { knownFrom } from '#lib/recordings/known.ts';

	/** A link the route has already resolved. */
	interface Link {
		text: string;
		href: string;
	}

	interface Props {
		step: Step;
		lifelines: readonly Lifeline[];
		mode?: Mode;
		/** Where someone new starts, shown on the first step. */
		intro?: string | null;
		change?: ViewDiff | null;
		resets?: readonly Reset[];
		links?: readonly Link[];
		/** A setting changed nothing in this diagram, but did in the other one. */
		elsewhere?: Link | null;
		/** The setting that was just changed, because a change alone does not say why it exists. */
		changed?: SettingId | null;
		onexplainartifact?: (id: ArtifactId) => void;
	}

	let {
		step,
		lifelines,
		mode = 'advanced',
		intro = null,
		change = null,
		resets = [],
		links = [],
		elsewhere = null,
		changed = null,
		onexplainartifact
	}: Props = $props();

	const simple = $derived(mode === 'simple');
	const known = $derived(knownFrom(step));
	const nameOf = (id: string) => {
		const line = lifelines.find((candidate) => candidate.id === id);
		return (simple ? line?.plainName : line?.name) ?? id;
	};
	const labelOf = (id: SettingId) =>
		simple ? (settingDefs[id].simple?.label ?? settingDefs[id].label) : settingDefs[id].label;
	const carried = $derived([
		...new Set(step.fields.flatMap((field) => (field.artifact ? [field.artifact] : [])))
	]);
	const places: Record<string, string> = {
		query: 'query',
		header: 'header',
		body: 'body',
		token: 'in the token',
		setting: 'setting',
		path: 'path'
	};

	const count = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;
	const summary = $derived.by(() => {
		if (!change) return [];
		const lines = [
			change.addedLifelines.length && `${count(change.addedLifelines.length, 'lifeline')} added`,
			change.removedLifelines.length &&
				`${count(change.removedLifelines.length, 'lifeline')} removed`,
			!simple &&
				change.renamedLifelines.length &&
				`${count(change.renamedLifelines.length, 'lifeline')} with a new role`,
			change.addedSteps.length && `${count(change.addedSteps.length, 'step')} added`,
			change.removedSteps.length && `${count(change.removedSteps.length, 'step')} removed`,
			!simple &&
				change.addedFields.length &&
				`${count(change.addedFields.length, 'field')} added to existing messages`,
			!simple &&
				change.removedFields.length &&
				`${count(change.removedFields.length, 'field')} removed from existing messages`,
			!simple &&
				change.rewordedSteps.length &&
				`${count(change.rewordedSteps.length, 'message')} changed`
		];
		return lines.filter((line): line is string => Boolean(line));
	});
	const showChange = $derived(summary.length > 0 || elsewhere !== null || change !== null);
</script>

{#if intro}
	<p class="intro" data-testid="intro">{intro}</p>
{/if}

{#if showChange}
	<section class="change" data-testid="change-summary">
		<h2>What changed</h2>
		{#if changed}
			<p class="why" data-testid="change-why">{settingDefs[changed].why}</p>
		{/if}
		<ul>
			{#each summary as line (line)}<li>{line}</li>{/each}
			{#each resets as reset (reset.setting)}
				<li>{labelOf(reset.setting)} was reset. {reset.because}</li>
			{/each}
			{#if elsewhere}
				<li>
					Nothing in this diagram.
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the route resolves it -->
					<a href={elsewhere.href} data-testid="changed-elsewhere">{elsewhere.text}</a>
				</li>
			{/if}
		</ul>
	</section>
{/if}

<section data-testid="step-detail" aria-live="polite">
	<p class="route">
		{#if step.from === step.to}
			{nameOf(step.from)}, internally
		{:else}
			{nameOf(step.from)} to {nameOf(step.to)}
		{/if}
	</p>
	<h2 class="title">{simple ? step.plain : step.label}</h2>
	{#if !simple && step.plain !== step.label}
		<p class="plain">{step.plain}</p>
	{/if}
	<p>{step.concept}</p>
	<p class="channel" data-channel={step.channel} data-testid="step-channel">
		<strong>{channels[step.channel].label}.</strong>
		{channels[step.channel].explains}
	</p>
	{#if known}
		<p class="known" data-known={known.kind} data-testid="step-known">
			{#if known.kind === 'recorded'}
				Recorded from Keycloak {known.keycloak} on {known.date}.
			{:else if known.kind === 'spec'}
				From {known.source} only. Keycloak did not do this when it was recorded.
			{:else}
				Not checked against a real server yet.
			{/if}
		</p>
	{/if}
	{#if step.causes.length}
		<p class="cause">Here because of: {step.causes.map(labelOf).join(', ')}</p>
	{/if}
	{#if step.pitfall}
		<details class="pitfall" data-testid="step-pitfall">
			<summary>{step.pitfall.title}</summary>
			<p>{step.pitfall.text}</p>
			{#if step.pitfall.keycloak}<p class="keycloak">{step.pitfall.keycloak}</p>{/if}
		</details>
	{/if}
	{#each links as link (link.href)}
		<p>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the route resolves it -->
			<a href={link.href} data-testid="step-link">{link.text}</a>
		</p>
	{/each}

	{#if simple && carried.length}
		<h3>What it carries</h3>
		<ul class="carried" data-testid="step-carried">
			{#each carried as id (id)}
				<li>
					<button
						type="button"
						class="artifact"
						data-artifact={id}
						onclick={() => onexplainartifact?.(id)}
					>
						{artifacts[id].label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if !simple && step.fields.length}
		<h3>What it carries</h3>
		<ul class="fields">
			{#each step.fields as field (field.name)}
				<li class:changed={field.changed}>
					<code>{field.name}</code>
					<span class="place">{places[field.place]}</span>
					{#if field.note}<span class="note">{field.note}</span>{/if}
					{#if field.changed}
						<span class="note cause">From: {field.causes.map(labelOf).join(', ')}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	h2,
	h3 {
		margin: 0;
	}

	.change {
		margin-bottom: 16px;
		padding: 10px 12px;
		background: var(--fresh-soft);
		border: 1px solid var(--fresh);
		border-radius: 8px;
	}

	.change h2 {
		font-size: 12px;
		color: var(--fresh);
	}

	.intro {
		margin: 0 0 14px;
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--panel);
		font-size: 13.5px;
	}

	.why {
		margin: 4px 0;
		font-size: 12.5px;
	}

	.plain {
		margin: -4px 0 8px;
		color: var(--muted);
		font-size: 12.5px;
	}

	.pitfall {
		margin: 0 0 8px;
		padding: 6px 10px;
		border: 1px solid var(--line);
		border-radius: 6px;
		font-size: 12.5px;
	}

	.pitfall summary {
		cursor: pointer;
		font-weight: 600;
	}

	.pitfall p {
		margin: 6px 0 0;
	}

	.keycloak {
		color: var(--muted);
	}

	.carried {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 6px 0 0;
		padding: 0;
		list-style: none;
	}

	.artifact {
		padding: 1px 10px;
		border-radius: 10px;
		border-color: var(--chip);
		background: var(--chip-soft);
		color: var(--chip);
		font-size: 12px;
		font-weight: 600;
		--chip: var(--muted);
		--chip-soft: var(--panel);
	}

	.artifact[data-artifact='password'] {
		--chip: var(--password);
		--chip-soft: var(--password-soft);
	}

	.artifact[data-artifact='code'] {
		--chip: var(--code);
		--chip-soft: var(--code-soft);
	}

	.artifact[data-artifact='secret'] {
		--chip: var(--secret);
		--chip-soft: var(--secret-soft);
	}

	.artifact[data-artifact='access-token'] {
		--chip: var(--access);
		--chip-soft: var(--access-soft);
	}

	.artifact[data-artifact='id-token'] {
		--chip: var(--identity);
		--chip-soft: var(--identity-soft);
	}

	.artifact[data-artifact='proof'] {
		--chip: var(--proof);
		--chip-soft: var(--proof-soft);
	}

	.artifact[data-artifact='upstream-token'] {
		--chip: var(--upstream);
		--chip-soft: var(--upstream-soft);
	}

	.change ul {
		margin: 4px 0 0;
		padding-left: 16px;
		font-size: 12.5px;
	}

	.route {
		margin: 0;
		color: var(--muted);
		font-size: 12px;
	}

	.title {
		margin: 2px 0 8px;
		font-size: 18px;
		font-weight: 600;
		line-height: 1.3;
	}

	.channel {
		padding: 6px 10px;
		border-left: 3px solid var(--tone);
		background: var(--panel);
		color: var(--muted);
		font-size: 12.5px;
		--tone: var(--muted);
	}

	.channel strong {
		color: var(--fg);
		font-weight: 600;
	}

	.known {
		color: var(--muted);
		font-size: 12px;
	}

	.known[data-known='spec'] {
		color: var(--fresh);
	}

	.channel[data-channel='front'] {
		--tone: var(--front);
	}

	.channel[data-channel='back'] {
		--tone: var(--back);
	}

	.channel[data-channel='people'] {
		--tone: var(--people);
	}

	p {
		margin: 0 0 8px;
	}

	.cause {
		color: var(--fresh);
		font-size: 12px;
	}

	h3 {
		margin-top: 14px;
		font-size: 12px;
		color: var(--muted);
	}

	.fields {
		margin: 6px 0 0;
		padding: 0;
		list-style: none;
	}

	.fields li {
		padding: 5px 0;
		border-top: 1px solid var(--line);
	}

	.fields li.changed code {
		color: var(--fresh);
	}

	.place {
		margin-left: 6px;
		color: var(--muted);
		font-size: 11.5px;
	}

	.note {
		display: block;
		color: var(--muted);
		font-size: 12px;
	}

	.note.cause {
		color: var(--fresh);
	}
</style>
