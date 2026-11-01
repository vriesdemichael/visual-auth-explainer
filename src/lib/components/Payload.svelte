<script lang="ts">
	import type { Step } from '#lib/flow/model.ts';
	import type { RecordedMessage } from '#lib/recordings/format.ts';
	import {
		artifactOf,
		jwtsIn,
		originOf,
		rawLines,
		type Line,
		type RunValue
	} from '#lib/recordings/wire.ts';

	interface Props {
		step: Step;
		message: RecordedMessage;
		trace: readonly RunValue[];
		numberOf: (step: string) => number | null;
		onstep?: (step: string) => void;
	}

	let { step, message, trace, numberOf, onstep }: Props = $props();

	const LONG = 40;
	const lines = $derived(rawLines(message));
	const jwts = $derived(jwtsIn(lines));
	const origin = (line: Line) => originOf(line, step.id, trace);
	let opened = $state<Record<string, boolean>>({});
</script>

<div class="raw" data-testid="payload" tabindex="-1">
	{#each lines as line, i (i)}
		{@const from = origin(line)}
		<div class="line">
			<span data-line
				>{line.before}{#if line.value !== undefined}{#if line.value.length > LONG}<button
							type="button"
							class="value long"
							class:open={opened[i]}
							data-artifact={artifactOf(step, line.name)}
							aria-expanded={Boolean(opened[i])}
							onclick={() => (opened[i] = !opened[i])}>{line.value}</button
						>{:else}<span class="value" data-artifact={artifactOf(step, line.name)}
							>{line.value}</span
						>{/if}{/if}{line.after ?? ''}</span
			>
			{#if from && 'new' in from}
				<span class="origin new" data-new={line.name}>new</span>
			{:else if from && numberOf(from.from) !== null}
				<button
					type="button"
					class="origin from"
					data-from={from.from}
					onclick={() => onstep?.(from.from)}
				>
					from step {numberOf(from.from)}
				</button>
			{/if}
		</div>
	{/each}
</div>

{#each jwts as jwt (jwt.name)}
	<details class="jwt" data-testid="jwt">
		<summary>Inside <code>{jwt.name}</code></summary>
		<pre>{JSON.stringify(jwt.header, null, 2)}</pre>
		<pre>{JSON.stringify(jwt.claims, null, 2)}</pre>
	</details>
{/each}

<style>
	.raw {
		padding: 8px 10px;
		border-radius: 6px;
		background: var(--panel);
		font-family: var(--mono);
		font-size: 11.5px;
		line-height: 1.5;
	}

	.raw:focus-visible {
		outline: 2px solid var(--accent);
	}

	.line {
		min-height: 1.5em;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.value {
		border-radius: 3px;
		color: var(--chip, inherit);
		background: var(--chip-soft, transparent);
		font-weight: 500;
	}

	button.value {
		padding: 0;
		border: 0;
		font: inherit;
		font-weight: 500;
		text-align: left;
		word-break: break-all;
	}

	.long:not(.open) {
		display: inline-block;
		max-width: 12ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: bottom;
	}

	.origin {
		margin-left: 6px;
		padding: 0;
		border: 0;
		background: none;
		font-family: var(--sans);
		font-size: 11px;
		white-space: nowrap;
	}

	.new {
		color: var(--fg);
		font-weight: 600;
	}

	.from {
		color: var(--accent);
		text-decoration: underline;
	}

	.jwt {
		margin-top: 6px;
		font-size: 12.5px;
	}

	.jwt summary {
		cursor: pointer;
	}

	.jwt pre {
		margin: 4px 0 0;
		padding: 8px 10px;
		overflow-x: auto;
		border-radius: 6px;
		background: var(--panel);
		font-family: var(--mono);
		font-size: 11.5px;
	}
</style>
