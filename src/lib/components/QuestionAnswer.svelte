<script lang="ts">
	import Worded from '#lib/components/Worded.svelte';
	import { markTerms } from '#lib/flow/glossary.ts';

	interface Props {
		answer: string;
		onterm?: (id: string) => void;
		serverNamed?: boolean;
		/** Goes back to where the flow starts, when someone is not there already. */
		onrewind?: (() => void) | null;
	}

	let { answer, onrewind = null, onterm, serverNamed = true }: Props = $props();
	const segments = $derived(markTerms([answer], { serverNamed })[0]);
</script>

<section class="answer" data-testid="answer" aria-label="The short answer">
	<p><Worded {segments} {onterm} /></p>
	{#if onrewind}
		<button type="button" class="rewind" data-testid="how-we-got-here" onclick={onrewind}>
			See how we got here
		</button>
	{/if}
</section>

<style>
	.answer {
		margin: 0 0 16px;
		padding: 0 0 14px;
		border-bottom: 1px solid var(--line);
	}

	p {
		margin: 0;
		font-size: 15px;
		line-height: 1.45;
	}

	.rewind {
		margin-top: 6px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--muted);
		font-size: 12px;
		text-decoration: underline;
	}
</style>
