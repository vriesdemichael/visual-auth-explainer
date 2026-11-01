<script lang="ts">
	import { untrack } from 'svelte';
	import { ICONS } from '#lib/diagram/icons.ts';
	import { layHeld, ROW_OFFSET, SELF_LOOP, type DiagramLayout } from '#lib/diagram/layout.ts';
	import { interpolate, toFrame, TRANSITION_MS, type Frame } from '#lib/diagram/motion.ts';
	import { artifacts, type ArtifactId } from '#lib/flow/vocabulary.ts';

	interface Props {
		layout: DiagramLayout;
		currentStep: string;
		fresh?: ReadonlySet<string>;
		animate?: boolean;
		/** What each lifeline has seen, up to the current step. */
		holdings?: Readonly<Record<string, readonly ArtifactId[]>>;
		onselect?: (step: string) => void;
		onexplainlifeline?: (id: string) => void;
		onexplainartifact?: (id: ArtifactId) => void;
	}

	let {
		layout,
		currentStep,
		fresh = new Set(),
		animate = true,
		holdings = {},
		onselect,
		onexplainlifeline,
		onexplainartifact
	}: Props = $props();

	let frame = $state<Frame>(untrack(() => toFrame(layout)));
	let animating = $state(false);
	let scroller = $state<HTMLElement>();
	let drawn = untrack(() => layout);

	$effect(() => {
		// The first frame is already this layout, so a new diagram appears without moving.
		if (layout === drawn) return;
		drawn = layout;
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
	const currentRow = $derived(layout.rows[currentIndex]);

	$effect(() => {
		const row = scroller?.querySelector(`[data-step="${CSS.escape(currentStep)}"]`);
		row?.scrollIntoView({ block: 'nearest' });
	});

	const middle = (a: number, b: number) => (a + b) / 2;
	const tipX = (x1: number, x2: number, draw: number) => x1 + (x2 - x1) * draw;
	const headPoints = (x: number, y: number, direction: number) =>
		`${x},${y} ${x - 8 * direction},${y - 4.5} ${x - 8 * direction},${y + 4.5}`;

	function rowState(id: string) {
		const index = order.get(id);
		if (index === undefined) return 'leaving';
		return index === currentIndex ? 'current' : index < currentIndex ? 'past' : 'future';
	}

	const heldText = (ids: readonly ArtifactId[]) =>
		ids.length ? ids.map((id) => artifacts[id].label).join(', ') : 'nothing yet';
	const activate = (event: KeyboardEvent, then: () => void) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		then();
	};
</script>

<div class="diagram" data-testid="diagram" data-animating={animating}>
	<svg
		class="heads"
		viewBox={`0 0 ${frame.width} ${frame.headHeight}`}
		role="group"
		aria-label="Who takes part, and what each has seen so far"
		data-testid="diagram-heads"
	>
		{#each frame.lanes as lane (lane.id)}
			<g
				class="lane-head"
				class:fresh={fresh.has(lane.id)}
				class:active={currentRow && (lane.id === currentRow.from || lane.id === currentRow.to)}
				style:opacity={lane.opacity}
				data-lifeline={lane.leaving ? undefined : lane.id}
				transform={`translate(${lane.x} 0)`}
				role="button"
				tabindex={lane.leaving ? -1 : 0}
				aria-describedby={`seen-${lane.id}`}
				onclick={() => onexplainlifeline?.(lane.id)}
				onkeydown={(event) => activate(event, () => onexplainlifeline?.(lane.id))}
			>
				<desc id={`seen-${lane.id}`}>Has seen: {heldText(holdings[lane.id] ?? [])}.</desc>
				<rect x="-72" y="5" width="144" height="46" rx="8" />
				<path class="icon" d={ICONS[lane.icon]} transform="translate(-65 16) scale(0.95)" />
				<text class="name" x="-38" y="25">{lane.name}</text>
				<text class="role" x="-38" y="41">{lane.role}</text>
				{#if !lane.leaving}
					{#each layHeld(holdings[lane.id] ?? []) as chip (chip.artifact)}
						<g class="held" data-artifact={chip.artifact} data-held={`${lane.id}:${chip.artifact}`}>
							<rect x={chip.x} y={chip.y} width={chip.width} height="16" rx="8" />
							<text x={chip.x + chip.width / 2} y={chip.y + 11.5} text-anchor="middle">
								{chip.text}
							</text>
						</g>
					{/each}
				{/if}
			</g>
		{/each}
	</svg>

	<div class="scroller" bind:this={scroller}>
		<svg
			class="body"
			viewBox={`0 0 ${frame.width} ${frame.height}`}
			role="group"
			aria-label="The messages in this diagram"
		>
			{#each frame.lanes as lane (lane.id)}
				<line
					class="lifeline"
					class:active={currentRow && (lane.id === currentRow.from || lane.id === currentRow.to)}
					x1={lane.x}
					x2={lane.x}
					y1="0"
					y2={frame.height}
					style:opacity={lane.opacity}
				/>
			{/each}

			{#each frame.groups as group (group.id)}
				<g
					class="group"
					style:opacity={group.opacity}
					data-group={group.leaving ? undefined : group.id}
				>
					<rect x={group.x} y={group.y} width={group.width} height={group.height} rx="10" />
					<text x={group.x + 12} y={group.y + 18}>{group.label}</text>
				</g>
			{/each}

			{#each frame.rows as row (row.id)}
				{@const state = rowState(row.id)}
				{@const tip = tipX(row.x1, row.x2, row.draw)}
				<g
					class={`row ${row.kind} ${row.channel} ${state}`}
					class:fresh={fresh.has(row.id)}
					style:opacity={row.opacity}
					data-step={row.leaving ? undefined : row.id}
					data-state={state}
					data-channel={row.channel}
					role="button"
					tabindex={row.leaving ? -1 : 0}
					aria-describedby={`route-${row.id}`}
					aria-current={state === 'current' ? 'step' : undefined}
					onclick={() => onselect?.(row.id)}
					onkeydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							onselect?.(row.id);
						}
					}}
				>
					<desc id={`route-${row.id}`}>{row.route}</desc>
					<rect class="hit" x="0" y={row.y - ROW_OFFSET} width={frame.width} height={row.band} />
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
					{:else}
						<line x1={row.x1} x2={tip} y1={row.y} y2={row.y} />
						<polygon points={headPoints(tip, row.y, Math.sign(row.x2 - row.x1) || 1)} />
						{#if state === 'current' && !row.leaving}
							<!-- Restarts on every step, so the message visibly travels from one to the other. -->
							{#key currentStep}
								<circle
									class="packet"
									cx={row.x1}
									cy={row.y}
									r="5"
									style:--travel={`${row.x2 - row.x1}px`}
								/>
							{/key}
						{/if}
					{/if}
					<g class="number" transform={`translate(${row.x1} ${row.self ? row.y - 6 : row.y})`}>
						<circle r="9.5" />
						<text y="3.7" text-anchor="middle">{row.number}</text>
					</g>
					{#if row.self}
						<text
							class="label"
							x={row.x1 + row.selfSide * (SELF_LOOP.width + 8)}
							y={row.y + 7}
							text-anchor={row.selfSide === 1 ? 'start' : 'end'}
						>
							{row.label}
						</text>
					{:else}
						<text class="label" x={middle(row.x1, row.x2)} y={row.y - 8} text-anchor="middle">
							{row.label}
						</text>
					{/if}
				</g>
			{/each}

			{#each frame.chips as chip (chip.id)}
				{@const state = rowState(chip.step)}
				<!-- A chip with no token in it is not a button, so the role depends on the chip. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<g
					class={`chip ${state}`}
					class:fresh={fresh.has(chip.id) || fresh.has(chip.step)}
					style:opacity={chip.opacity}
					data-chip={chip.leaving ? undefined : chip.id}
					data-artifact={chip.artifact}
					role={chip.artifact ? 'button' : undefined}
					tabindex={chip.artifact ? -1 : undefined}
					onclick={() => {
						if (chip.artifact) onexplainartifact?.(chip.artifact);
					}}
					onkeydown={(event) => {
						if (chip.artifact) activate(event, () => onexplainartifact?.(chip.artifact!));
					}}
				>
					<rect x={chip.x} y={chip.y} width={chip.width} height="18" rx="9" />
					<text x={chip.x + chip.width / 2} y={chip.y + 13} text-anchor="middle">{chip.text}</text>
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
		background: var(--panel);
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
		fill: var(--raised);
		stroke: var(--line);
		transition:
			fill 0.2s,
			stroke 0.2s;
	}

	.lane-head .icon {
		fill: none;
		stroke: var(--muted);
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.lane-head .name {
		font-weight: 600;
		font-size: 13px;
	}

	.lane-head .role {
		fill: var(--muted);
		font-size: 10.5px;
	}

	.lane-head.active > rect {
		fill: var(--accent-soft);
		stroke: var(--accent);
		stroke-width: 1.5;
	}

	.lane-head.active .icon {
		stroke: var(--accent);
	}

	.lane-head.fresh > rect {
		fill: var(--fresh-soft);
		stroke: var(--fresh);
	}

	.lane-head.fresh .role {
		fill: var(--fresh);
	}

	.held rect {
		stroke-width: 1;
	}

	.held text {
		font-size: 9.5px;
		font-weight: 600;
	}

	.lifeline {
		stroke: var(--line);
		stroke-width: 1;
	}

	.lifeline.active {
		stroke: var(--strong-line);
	}

	.group rect {
		fill: color-mix(in srgb, var(--panel) 55%, transparent);
		stroke: var(--strong-line);
		stroke-dasharray: 6 4;
	}

	.group text {
		fill: var(--muted);
		font-size: 11.5px;
		font-weight: 600;
	}

	.row {
		cursor: pointer;
		--row: var(--strong-line);
	}

	.row.front {
		--row: var(--front);
	}

	.row.back {
		--row: var(--back);
	}

	.row.people {
		--row: var(--people);
	}

	.row.internal {
		--row: var(--muted);
	}

	.row:focus {
		outline: none;
	}

	.row:focus-visible .hit {
		stroke: var(--accent);
		stroke-width: 1.5;
	}

	.hit {
		fill: transparent;
	}

	.row:hover .hit {
		fill: color-mix(in srgb, var(--panel) 70%, transparent);
	}

	.row line,
	.row path {
		stroke: var(--row);
		stroke-width: 1.6;
		fill: none;
	}

	.row polygon {
		fill: var(--row);
	}

	.row.response line {
		stroke-dasharray: 7 5;
	}

	.row.human line {
		stroke-dasharray: 1.5 5;
		stroke-linecap: round;
		stroke-width: 2.4;
	}

	.label {
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 4px;
		fill: var(--muted);
	}

	/* Only what has happened is spelled out. Ahead there is just the shape of what is to come. */
	.row.future line,
	.row.future path,
	.row.future polygon {
		opacity: 0.32;
	}

	.row.future .label {
		opacity: 0;
	}

	.row.future:hover .label,
	.row.future:focus-visible .label,
	.row.fresh .label {
		opacity: 1;
	}

	.number circle {
		fill: var(--row);
		stroke: var(--bg);
		stroke-width: 2;
	}

	.number text {
		fill: var(--on-tone);
		font-size: 10px;
		font-weight: 600;
	}

	.row.future .number circle {
		fill: var(--bg);
		stroke: var(--line);
		stroke-width: 1;
	}

	.row.future .number text {
		fill: var(--muted);
	}

	.row.current .hit,
	.row.current:hover .hit {
		fill: var(--accent-soft);
	}

	.row.current .label {
		fill: var(--fg);
		font-weight: 600;
		font-size: 13.5px;
		stroke: var(--accent-soft);
	}

	.row.current line,
	.row.current path {
		stroke-width: 2.6;
	}

	.packet {
		fill: var(--row);
		stroke: var(--accent-soft);
		stroke-width: 2;
		opacity: 0;
		animation: travel 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes travel {
		from {
			transform: translateX(0);
			opacity: 1;
		}

		85% {
			opacity: 1;
		}

		to {
			transform: translateX(var(--travel));
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.packet {
			animation: none;
		}
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
	}

	.row.fresh.future .number circle {
		fill: var(--fresh);
		stroke: var(--bg);
	}

	.row.fresh.future .number text {
		fill: var(--on-tone);
	}

	.lane-head {
		cursor: pointer;
	}

	.lane-head:hover > rect {
		stroke: var(--strong-line);
	}

	.lane-head:focus {
		outline: none;
	}

	.lane-head:focus-visible > rect {
		stroke: var(--accent);
		stroke-width: 2;
	}

	.chip {
		pointer-events: none;
	}

	.chip:not([data-artifact]) {
		--chip: var(--muted);
		--chip-soft: var(--panel);
	}

	.chip[role='button']:not(.future) {
		pointer-events: auto;
		cursor: pointer;
	}

	.chip rect,
	.held rect {
		fill: var(--chip-soft);
		stroke: var(--chip);
	}

	.chip text,
	.held text {
		fill: var(--chip);
	}

	.chip text {
		font-size: 11px;
		font-weight: 600;
	}

	.chip:not([data-artifact]) text {
		font-family: var(--mono);
		font-weight: 500;
	}

	.chip.future:not(.fresh) {
		opacity: 0 !important;
	}

	.chip.fresh {
		--chip: var(--fresh);
		--chip-soft: var(--fresh-soft);
	}
</style>
