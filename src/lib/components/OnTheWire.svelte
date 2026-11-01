<script lang="ts">
	import Payload from '#lib/components/Payload.svelte';
	import RunValues from '#lib/components/RunValues.svelte';
	import type { Step } from '#lib/flow/model.ts';
	import type { Recording } from '#lib/recordings/format.ts';
	import { traceRun } from '#lib/recordings/wire.ts';

	/** A link the route has already resolved. */
	interface Link {
		text: string;
		href: string;
	}

	interface Props {
		step: Step;
		/** The one real run for these settings, once it has loaded. */
		recording: Recording | null;
		/** What it is like while there is none to show. */
		status: 'loaded' | 'loading' | 'failed' | 'none';
		/** The closest states that do have a recording, when these settings have none. */
		nearest?: readonly Link[];
		/** The step someone just executed, when this step is its answer. */
		answerTo?: string | null;
		numberOf: (step: string) => number | null;
		onstep?: (step: string) => void;
	}

	let {
		step,
		recording,
		status,
		nearest = [],
		answerTo = null,
		numberOf,
		onstep
	}: Props = $props();

	const message = $derived(recording?.messages.find((candidate) => candidate.step === step.id));
	const trace = $derived(recording ? traceRun(recording) : []);
	const here = $derived(numberOf(step.id) ?? 0);
	// Earlier steps always count as executed, so what the run has so far follows from the step alone.
	const soFar = $derived(trace.filter((value) => (numberOf(value.step) ?? Infinity) <= here));
</script>

<section class="wire" data-testid="on-the-wire">
	<h3>On the wire</h3>
	{#if status === 'none'}
		<div data-testid="no-recording">
			<p>
				No recording of this exact combination of settings, so nothing is shown. Payloads here are
				never put together by hand.
			</p>
			{#if nearest.length}
				<p>The closest that were recorded:</p>
				<ul>
					{#each nearest as link (link.href)}
						<li>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the route resolves it -->
							<a href={link.href} data-testid="nearest-recording">{link.text}</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if status === 'loading'}
		<p data-testid="recording-loading">Loading the recording.</p>
	{:else if status === 'failed' || !recording}
		<p data-testid="recording-failed">The recording could not be loaded.</p>
	{:else if !message}
		<p data-testid="not-recorded">
			A real Keycloak did not send this, so there is nothing to show.
		</p>
	{:else}
		{#if answerTo}
			<p class="answer" data-testid="answer-to">The answer to step {numberOf(answerTo)}.</p>
		{/if}
		<Payload {step} {message} {trace} {numberOf} {onstep} />
		<RunValues values={soFar} {numberOf} {onstep} />
		<p class="origin" data-testid="payload-origin">
			One real run against Keycloak {recording.keycloak}, on {recording.recordedAt}, with throwaway
			values. Only the headers that matter here were kept.
		</p>
	{/if}
</section>

<style>
	.wire {
		margin-top: 12px;
	}

	h3 {
		margin: 0 0 6px;
		font-size: 13px;
	}

	p {
		margin: 0 0 6px;
		font-size: 12.5px;
	}

	ul {
		margin: 0;
		padding-left: 16px;
		font-size: 12.5px;
	}

	.answer {
		font-weight: 600;
	}

	.origin {
		margin-top: 8px;
		color: var(--muted);
		font-size: 11.5px;
	}
</style>
