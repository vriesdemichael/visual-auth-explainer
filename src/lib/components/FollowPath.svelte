<script lang="ts">
	import type { Stop } from '#lib/flow/follow.ts';

	interface Props {
		/** What is being followed, in words. */
		label: string;
		stops: readonly Stop[];
		current: string;
		numberOf: (step: string) => number | null;
		onstep: (step: string) => void;
		onstop: () => void;
	}

	let { label, stops, current, numberOf, onstep, onstop }: Props = $props();
</script>

<section data-testid="follow-path" aria-label={`Where the ${label} goes`}>
	<h2>Following: {label}</h2>
	<ol>
		{#each stops as stop (stop.step)}
			<li>
				<button
					type="button"
					data-stop={stop.step}
					aria-current={stop.step === current ? 'step' : undefined}
					onclick={() => onstep(stop.step)}
				>
					<span class="number">{numberOf(stop.step)}</span>
					{stop.says}
				</button>
			</li>
		{/each}
	</ol>
	<button type="button" class="off" data-testid="follow-off" onclick={onstop}>Stop following</button
	>
</section>

<style>
	section {
		margin: 0 0 14px;
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--panel);
		font-size: 12.5px;
	}

	h2 {
		margin: 0 0 6px;
		font-size: 13px;
	}

	ol {
		margin: 0 0 6px;
		padding: 0;
		list-style: none;
	}

	li button {
		display: flex;
		align-items: baseline;
		gap: 6px;
		width: 100%;
		padding: 2px 0;
		border: 0;
		background: none;
		color: var(--fg);
		font-size: 12.5px;
		text-align: left;
	}

	li button:hover {
		text-decoration: underline;
	}

	li button[aria-current] {
		font-weight: 600;
	}

	.number {
		flex: none;
		min-width: 1.6em;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.off {
		padding: 0;
		border: 0;
		background: none;
		color: var(--muted);
		font-size: 12px;
		text-decoration: underline;
	}
</style>
