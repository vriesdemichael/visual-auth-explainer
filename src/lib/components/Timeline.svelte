<script lang="ts">
	import type { Part } from '#lib/flow/model.ts';

	interface Props {
		parts: readonly Part[];
		current: string;
		onjump: (step: string) => void;
	}

	let { parts, current, onjump }: Props = $props();

	const steps = $derived(parts.flatMap((part) => part.steps));
	const position = $derived(steps.indexOf(current) + 1);
	const here = $derived(parts.find((part) => part.steps.includes(current)));

	function pick(event: MouseEvent) {
		const step = (event.target as Element).closest<HTMLElement>('[data-jump]')?.dataset.jump;
		if (step) onjump(step);
	}
</script>

<!-- The arrow keys, Home and End move through the steps from anywhere on this screen, this included. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="timeline"
	data-testid="timeline"
	role="slider"
	tabindex="0"
	aria-label="Where you are in this diagram"
	aria-orientation="horizontal"
	aria-valuemin="1"
	aria-valuemax={steps.length}
	aria-valuenow={position}
	aria-valuetext={`Step ${position} of ${steps.length}, ${here?.label}`}
	onclick={pick}
>
	{#each parts as part (part.label)}
		<div class="part" class:here={part === here} style:flex-grow={part.steps.length}>
			<span class="name" title={part.why} data-part={part.label} data-jump={part.steps[0]}>
				{part.label}
			</span>
			<div class="ticks">
				{#each part.steps as step (step)}
					{@const number = steps.indexOf(step) + 1}
					<span
						class="tick"
						class:done={number < position}
						class:current={number === position}
						title={`Step ${number}`}
						data-tick={step}
						data-jump={step}
					></span>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.timeline {
		display: flex;
		flex: 1;
		gap: 6px;
		min-width: 60px;
		margin: 0 8px;
		cursor: pointer;
	}

	.timeline:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.part {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.name {
		overflow: hidden;
		color: var(--muted);
		font-size: 11px;
		line-height: 14px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name:hover,
	.here .name {
		color: var(--fg);
	}

	.here .name {
		font-weight: 600;
	}

	.ticks {
		display: flex;
		gap: 1px;
	}

	/* The whole height can be clicked, and only the line in the middle of it is drawn. */
	.tick {
		flex: 1;
		height: 12px;
		min-width: 1px;
		background: linear-gradient(var(--line), var(--line)) center / 100% 4px no-repeat;
	}

	.tick:hover {
		background-size: 100% 8px;
	}

	.tick.done,
	.tick.current {
		background-image: linear-gradient(var(--accent), var(--accent));
	}

	.tick.current {
		background-size: 100% 12px;
	}

	@media (forced-colors: active) {
		.tick {
			background: CanvasText;
			clip-path: inset(4px 0);
			forced-color-adjust: none;
		}

		.tick.done {
			background: Highlight;
		}

		.tick.current {
			background: Highlight;
			clip-path: none;
		}
	}
</style>
