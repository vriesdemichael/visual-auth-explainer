<script lang="ts">
	interface Props {
		position: number;
		total: number;
		canGoBack: boolean;
		onback: () => void;
		onnext: () => void;
	}

	let { position, total, canGoBack, onback, onnext }: Props = $props();
</script>

<div class="controls">
	<button data-testid="back" disabled={!canGoBack} onclick={onback}>Back</button>
	<button class="next" data-testid="next" disabled={position >= total} onclick={onnext}>
		Next
	</button>
	<span class="position" data-testid="position">Step {position} of {total}</span>
	<div class="track" aria-hidden="true">
		<div class="fill" style:width={`${(position / total) * 100}%`}></div>
	</div>
	<span class="hint">Arrow keys work too</span>
</div>

<style>
	.controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.next:not(:disabled) {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-tone);
		font-weight: 600;
	}

	.position {
		margin-left: 8px;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.track {
		flex: 1;
		height: 4px;
		margin: 0 8px;
		border-radius: 2px;
		background: var(--line);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 2px;
		background: var(--accent);
		transition: width 0.25s;
	}

	.hint {
		color: var(--muted);
		font-size: 12px;
		white-space: nowrap;
	}
</style>
