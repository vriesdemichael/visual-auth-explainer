<script lang="ts">
	import { layoutDiagram, WIDTH } from '#lib/diagram/layout.ts';
	import type { FlowView } from '#lib/flow/model.ts';

	interface Props {
		view: FlowView;
	}

	let { view }: Props = $props();

	// The same spacing everywhere, so a diagram that does more is visibly larger.
	const SCALE = 200 / WIDTH;
	const ROW = 5;
	const TOP = 4;

	const layout = $derived(layoutDiagram(view));
	const x = (value: number) => value * SCALE;
	const y = (row: number) => TOP + row * ROW;
	const height = $derived(y(layout.rows.length) + 2);
</script>

<svg viewBox={`0 0 200 ${height}`} style:aspect-ratio={`200 / ${height}`} aria-hidden="true">
	{#each layout.lanes as lane (lane.id)}
		<line class="lane" x1={x(lane.x)} x2={x(lane.x)} y1="1" y2={height - 1} />
	{/each}
	{#each layout.rows as row, i (row.id)}
		{#if row.self}
			<circle class="self" data-channel={row.channel} cx={x(row.x1)} cy={y(i)} r="1.6" />
		{:else}
			<line
				class="row"
				data-channel={row.channel}
				x1={x(row.x1)}
				x2={x(row.x2)}
				y1={y(i)}
				y2={y(i)}
			/>
		{/if}
	{/each}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.lane {
		stroke: var(--line);
		stroke-width: 1;
	}

	.row {
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.row[data-channel='front'] {
		stroke: var(--front);
	}

	.row[data-channel='back'] {
		stroke: var(--back);
	}

	.row[data-channel='people'] {
		stroke: var(--people);
	}

	.self {
		fill: var(--muted);
	}
</style>
