<script lang="ts">
	import type { Lifeline, Step, ViewDiff } from '#lib/flow/model.ts';
	import { settingDefs, type Reset, type SettingId } from '#lib/flow/settings.ts';

	/** A link the route has already resolved. */
	interface Link {
		text: string;
		href: string;
	}

	interface Props {
		step: Step;
		lifelines: readonly Lifeline[];
		change?: ViewDiff | null;
		resets?: readonly Reset[];
		links?: readonly Link[];
		/** A setting changed nothing in this diagram, but did in the other one. */
		elsewhere?: Link | null;
	}

	let {
		step,
		lifelines,
		change = null,
		resets = [],
		links = [],
		elsewhere = null
	}: Props = $props();

	const nameOf = (id: string) => lifelines.find((line) => line.id === id)?.name ?? id;
	const labelOf = (id: SettingId) => settingDefs[id].label;
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
			change.renamedLifelines.length &&
				`${count(change.renamedLifelines.length, 'lifeline')} with a new role`,
			change.addedSteps.length && `${count(change.addedSteps.length, 'step')} added`,
			change.removedSteps.length && `${count(change.removedSteps.length, 'step')} removed`,
			change.addedFields.length &&
				`${count(change.addedFields.length, 'field')} added to existing messages`,
			change.removedFields.length &&
				`${count(change.removedFields.length, 'field')} removed from existing messages`,
			change.rewordedSteps.length && `${count(change.rewordedSteps.length, 'message')} changed`
		];
		return lines.filter((line): line is string => Boolean(line));
	});
</script>

{#if summary.length || elsewhere}
	<section class="change" data-testid="change-summary">
		<h2>What changed</h2>
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
		{#if step.kind === 'human'}<span class="human">People, not HTTP</span>{/if}
	</p>
	<h2 class="title">{step.label}</h2>
	<p>{step.concept}</p>
	{#if step.causes.length}
		<p class="cause">Here because of: {step.causes.map(labelOf).join(', ')}</p>
	{/if}
	{#each links as link (link.href)}
		<p>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the route resolves it -->
			<a href={link.href} data-testid="step-link">{link.text}</a>
		</p>
	{/each}

	{#if step.fields.length}
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

	.human {
		margin-left: 6px;
		color: var(--human);
	}

	.title {
		margin: 2px 0 6px;
		font-size: 16px;
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
