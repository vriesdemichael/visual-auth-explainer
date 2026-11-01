<script lang="ts">
	import type { Term } from '#lib/flow/glossary.ts';
	import { artifacts, type ArtifactId } from '#lib/flow/vocabulary.ts';
	import { refLabel, type SourceRef } from '#lib/sources/sources.ts';

	interface Props {
		title: string;
		text: string;
		/** For a lifeline: what it has seen so far. */
		seen?: readonly ArtifactId[];
		/** For a credential or token: who has seen it so far. */
		seenBy?: readonly string[];
		sources?: readonly SourceRef[];
		alsoCalled?: readonly string[];
		/** The parts of the diagram to choose from. */
		parts?: readonly Term[];
		onpart?: (id: string) => void;
		/** Where this can be seen, when it is not on screen as things stand. */
		seeIt?: string | null;
		/** It is about the server, which someone can leave out. */
		onleaveout?: (() => void) | null;
		onexplainartifact?: (id: ArtifactId) => void;
		onopensource?: (ref: SourceRef) => void;
		onclose: () => void;
	}

	let {
		title,
		text,
		seen,
		seenBy,
		sources = [],
		alsoCalled = [],
		parts = [],
		onpart,
		seeIt = null,
		onleaveout = null,
		onexplainartifact,
		onopensource,
		onclose
	}: Props = $props();
</script>

<section data-testid="explanation">
	<header>
		<h2>{title}</h2>
		<button type="button" data-testid="explanation-close" onclick={onclose}>Close</button>
	</header>
	<p>{text}</p>
	{#if alsoCalled.length}
		<p class="seen" data-testid="explanation-also-called">Also called: {alsoCalled.join(', ')}.</p>
	{/if}
	{#if parts.length}
		<p class="parts" data-testid="explanation-parts">
			{#each parts as part (part.id)}
				<button type="button" class="chip" data-part={part.id} onclick={() => onpart?.(part.id)}>
					{part.name}
				</button>
			{/each}
		</p>
	{/if}
	{#if seeIt}
		<p class="seen">
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the route resolves it -->
			<a href={seeIt} data-sveltekit-reset="false" data-testid="explanation-see-it"
				>See it on the diagram</a
			>
		</p>
	{/if}
	{#if onleaveout}
		<p class="seen">
			<button type="button" class="chip" data-testid="leave-out-server" onclick={onleaveout}>
				Leave out what is only about Keycloak
			</button>
		</p>
	{/if}
	{#if seen}
		<p class="seen" data-testid="explanation-seen">
			{#if seen.length}
				Has seen so far:
				{#each seen as id (id)}
					<button type="button" class="chip" onclick={() => onexplainartifact?.(id)}>
						{artifacts[id].label}
					</button>
				{/each}
			{:else}
				Has seen nothing so far.
			{/if}
		</p>
	{/if}
	{#if seenBy}
		<p class="seen" data-testid="explanation-seen-by">
			{#if seenBy.length}
				Seen so far by: {seenBy.join(', ')}.
			{:else}
				Nobody has seen this yet.
			{/if}
		</p>
	{/if}
	{#if sources.length}
		<p class="seen">
			Read more:
			{#each sources as ref (ref.source)}
				<button type="button" class="chip" onclick={() => onopensource?.(ref)}>
					{refLabel(ref)}
				</button>
			{/each}
		</p>
	{/if}
</section>

<style>
	section {
		margin-bottom: 16px;
		padding: 10px 12px;
		border: 1px solid var(--accent);
		border-radius: 8px;
		background: var(--accent-soft);
	}

	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}

	h2 {
		margin: 0 0 4px;
		font-size: 15px;
		font-weight: 600;
	}

	p {
		margin: 0 0 6px;
		font-size: 13px;
	}

	p:last-child {
		margin-bottom: 0;
	}

	.seen {
		color: var(--muted);
		font-size: 12px;
	}

	.parts {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	button {
		padding: 0 8px;
		font-size: 12px;
	}
</style>
