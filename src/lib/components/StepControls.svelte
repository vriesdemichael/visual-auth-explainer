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
	<button data-testid="next" disabled={position >= total} onclick={onnext}>Next</button>
	<span data-testid="position">Step {position} of {total}</span>
	<span class="hint">Left and right arrow keys also work</span>
</div>

<style>
	.controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	span {
		margin-left: 8px;
	}

	.hint {
		margin-left: auto;
		color: var(--muted);
		font-size: 12px;
	}
</style>
