<script lang="ts">
	import { untrack } from 'svelte';
	import { SELF_LOOP, type DiagramLayout } from '#lib/diagram/layout.ts';
	import { interpolate, toFrame, TRANSITION_MS, type Frame } from '#lib/diagram/motion.ts';

	interface Props {
		layout: DiagramLayout;
		currentStep: string;
		fresh?: ReadonlySet<string>;
		animate?: boolean;
		onselect?: (step: string) => void;
		ontogglesetup?: () => void;
	}

	let {
		layout,
		currentStep,
		fresh = new Set(),
		animate = true,
		onselect,
		ontogglesetup
	}: Props = $props();

	let frame = $state<Frame>(untrack(() => toFrame(layout)));
	let animating = $state(false);
	let scroller = $state<HTMLElement>();

	$effect(() => {
		const target = toFrame(layout);
		const start = untrack(() => $state.snapshot(frame)) as Frame;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!untrack(() => animate) || reduced) {
			frame = target;
			animating = false;
			return;
		}
		let raf = 0;
		const began = performance.now();
		animating = true;
		const tick = (now: number) => {
			const t = Math.min(1, (now - began) / TRANSITION_MS);
			frame = interpolate(start, target, t);
			if (t < 1) raf = requestAnimationFrame(tick);
			else animating = false;
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const order = $derived(new Map(layout.rows.map((row, i) => [row.id, i])));
	const currentIndex = $derived(order.get(currentStep) ?? 0);

	$effect(() => {
		const row = scroller?.querySelector(`[data-step="${CSS.escape(currentStep)}"]`);
		row?.scrollIntoView({ block: 'nearest' });
	});

	const middle = (a: number, b: number) => (a + b) / 2;
	const tipX = (x1: number, x2: number, draw: number) => x1 + (x2 - x1) * draw;
	const headPoints = (x: number, y: number, direction: number) =>
		`${x},${y} ${x - 7 * direction},${y - 4} ${x - 7 * direction},${y + 4}`;

	function rowState(id: string) {
		const index = order.get(id);
		if (index === undefined) return 'leaving';
		return index === currentIndex ? 'current' : index < currentIndex ? 'past' : 'future';
	}
</script>

<div class="diagram" data-testid="diagram" data-animating={animating}>
	<svg
		class="heads"
		viewBox={`0 0 ${frame.width} 58`}
		role="img"
		aria-label="Who takes part in this flow"
	>
		{#each frame.lanes as lane (lane.id)}
			<g
				class="lane-head"
				class:fresh={fresh.has(lane.id)}
				style:opacity={lane.opacity}
				data-lifeline={lane.leaving ? undefined : lane.id}
				transform={`translate(${lane.x} 0)`}
			>
				<rect x="-62" y="6" width="124" height="46" rx="6" />
				<text class="name" y="25" text-anchor="middle">{lane.name}</text>
				<text class="role" y="42" text-anchor="middle">{lane.role}</text>
			</g>
		{/each}
	</svg>

	<div class="scroller" bind:this={scroller}>
		<svg
			class="body"
			viewBox={`0 0 ${frame.width} ${frame.height}`}
			role="group"
			aria-label="The messages in this flow"
		>
			{#each frame.lanes as lane (lane.id)}
				<line
					class="lifeline"
					x1={lane.x}
					x2={lane.x}
					y1="0"
					y2={frame.height}
					style:opacity={lane.opacity}
				/>
			{/each}

			<g
				class="band"
				role="button"
				tabindex="0"
				aria-expanded={frame.band.open}
				data-testid="setup-band"
				onclick={ontogglesetup}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						ontogglesetup?.();
					}
				}}
			>
				<rect x="8" y={frame.band.y} width={frame.width - 16} height="30" rx="6" />
				<text x="22" y={frame.band.y + 20}>
					{frame.band.open ? '▾' : '▸'}
					{frame.band.label} ({frame.band.count} steps)
				</text>
			</g>

			{#each frame.groups as group (group.id)}
				<g
					class="group"
					style:opacity={group.opacity}
					data-group={group.leaving ? undefined : group.id}
				>
					<rect x={group.x} y={group.y} width={group.width} height={group.height} rx="8" />
					<text x={group.x + 10} y={group.y + 17}>{group.label}</text>
				</g>
			{/each}

			{#each frame.rows as row (row.id)}
				{@const state = rowState(row.id)}
				{@const tip = tipX(row.x1, row.x2, row.draw)}
				<g
					class={`row ${row.kind} ${state}`}
					class:fresh={fresh.has(row.id)}
					style:opacity={row.opacity}
					data-step={row.leaving ? undefined : row.id}
					data-state={state}
					role="button"
					tabindex={row.leaving ? -1 : 0}
					aria-current={state === 'current' ? 'step' : undefined}
					onclick={() => onselect?.(row.id)}
					onkeydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							onselect?.(row.id);
						}
					}}
				>
					<rect class="hit" x="0" y={row.y - 26} width={frame.width} height="38" />
					{#if row.self}
						<path
							d={`M ${row.x1} ${row.y - 6} h ${row.selfSide * SELF_LOOP.width} v ${SELF_LOOP.height} h ${-row.selfSide * (SELF_LOOP.width - 6)}`}
							pathLength="1"
							stroke-dasharray={`${row.draw} 1`}
						/>
						<polygon
							points={headPoints(row.x1, row.y + 12, -row.selfSide)}
							style:opacity={row.draw}
						/>
						<text
							class="label"
							x={row.x1 + row.selfSide * (SELF_LOOP.width + 8)}
							y={row.y + 7}
							text-anchor={row.selfSide === 1 ? 'start' : 'end'}
						>
							{row.label}
						</text>
					{:else}
						<line x1={row.x1} x2={tip} y1={row.y} y2={row.y} />
						<polygon points={headPoints(tip, row.y, Math.sign(row.x2 - row.x1) || 1)} />
						<text class="label" x={middle(row.x1, row.x2)} y={row.y - 7} text-anchor="middle">
							{row.label}
						</text>
					{/if}
				</g>
			{/each}

			{#each frame.chips as chip (chip.id)}
				<g
					class="chip"
					class:fresh={fresh.has(chip.id)}
					style:opacity={chip.opacity}
					data-chip={chip.leaving ? undefined : chip.id}
				>
					<rect x={chip.x} y={chip.y} width={chip.width} height="18" rx="4" />
					<text x={chip.x + 6} y={chip.y + 13}>{chip.text}</text>
				</g>
			{/each}
		</svg>
	</div>
</div>

<style>
	.diagram {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.heads {
		flex: none;
		display: block;
		width: 100%;
		border-bottom: 1px solid var(--line);
	}

	.scroller {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		scroll-padding: 40px 0;
	}

	.body {
		display: block;
		width: 100%;
		height: auto;
	}

	text {
		fill: var(--fg);
		font-size: 12.5px;
	}

	.lane-head rect {
		fill: var(--panel);
		stroke: var(--line);
	}

	.lane-head .name {
		font-weight: 600;
		font-size: 13px;
	}

	.lane-head .role {
		fill: var(--muted);
		font-size: 11px;
	}

	.lane-head.fresh rect {
		fill: var(--fresh-soft);
		stroke: var(--fresh);
	}

	.lane-head.fresh .role {
		fill: var(--fresh);
	}

	.lifeline {
		stroke: var(--line);
		stroke-dasharray: 3 4;
	}

	.band {
		cursor: pointer;
	}

	.band rect {
		fill: var(--panel);
		stroke: var(--line);
	}

	.band text {
		fill: var(--muted);
	}

	.band:hover rect {
		stroke: var(--strong-line);
	}

	.group rect {
		fill: none;
		stroke: var(--strong-line);
		stroke-dasharray: 6 4;
	}

	.group text {
		fill: var(--muted);
		font-size: 11.5px;
	}

	.row {
		cursor: pointer;
		--row: var(--strong-line);
	}

	.row:focus {
		outline: none;
	}

	.row:focus-visible .hit {
		stroke: var(--accent);
	}

	.hit {
		fill: transparent;
	}

	.row line,
	.row path {
		stroke: var(--row);
		stroke-width: 1.5;
		fill: none;
	}

	.row polygon {
		fill: var(--row);
	}

	.row.response line {
		stroke-dasharray: 6 4;
	}

	.row.human {
		--row: var(--human);
	}

	.row.human line {
		stroke-dasharray: 2 4;
		stroke-width: 2;
	}

	.row.human .label {
		fill: var(--human);
	}

	.label {
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 4px;
	}

	.row.future line,
	.row.future path,
	.row.future polygon {
		opacity: 0.3;
	}

	.row.future .label {
		fill-opacity: 0.45;
	}

	.row.past {
		--row: var(--strong-line);
	}

	.row.current {
		--row: var(--accent);
	}

	.row.current .hit {
		fill: var(--accent-soft);
	}

	.row.current .label {
		fill: var(--accent);
		font-weight: 600;
		stroke: var(--accent-soft);
	}

	.row.current line,
	.row.current path {
		stroke-width: 2.5;
	}

	.row.fresh {
		--row: var(--fresh);
	}

	.row.fresh line,
	.row.fresh path,
	.row.fresh polygon {
		opacity: 1;
	}

	.row.fresh .label {
		fill: var(--fresh);
		fill-opacity: 1;
	}

	.chip {
		pointer-events: none;
	}

	.chip rect {
		fill: var(--panel);
		stroke: var(--line);
	}

	.chip text {
		font-family: var(--mono);
		font-size: 11px;
	}

	.chip.fresh rect {
		fill: var(--fresh-soft);
		stroke: var(--fresh);
	}

	.chip.fresh text {
		fill: var(--fresh);
	}
</style>
