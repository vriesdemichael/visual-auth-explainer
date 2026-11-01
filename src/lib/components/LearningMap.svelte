<script lang="ts">
	import type { MapNode, MapTrack } from '#lib/map/tracks.ts';

	interface Props {
		tracks: readonly MapTrack[];
		hrefOf: (node: MapNode) => string;
		/** The node someone came back from, to mark where they were. */
		current?: string | null;
		/** The question the diagram beside it is showing. */
		showing?: string | null;
		/** Someone is pointing at a question, with a mouse or by moving to it with the keyboard. */
		onpoint?: (node: MapNode) => void;
	}

	let { tracks, hrefOf, current = null, showing = null, onpoint }: Props = $props();
</script>

<!-- A question can be a long way down, and someone with an error wants to get to it quickly. -->
<nav class="jump" aria-label="Jump to a part of the map" data-testid="map-jump">
	{#each tracks as track (track.id)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- a place on this page -->
		<a href={`#${track.id}`}>{track.title}</a>
	{/each}
</nav>

<ol class="tracks" data-testid="map">
	{#each tracks as track (track.id)}
		<li class="track" id={track.id}>
			<h2>{track.title}</h2>
			<p class="lead">{track.lead}</p>
			{#each track.chains as chain, c (c)}
				<ol class="chain">
					{#each chain as node (node.id)}
						<li>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefOf resolves it -->
							<a
								class="stop"
								class:showing={showing === node.id}
								href={hrefOf(node)}
								data-testid={`node-${node.id}`}
								aria-current={current === node.id ? 'location' : undefined}
								onpointerenter={() => onpoint?.(node)}
								onfocus={() => onpoint?.(node)}
							>
								<span class="title">{node.title}</span>
								{#if node.mode === 'advanced'}
									<span class="tag">Advanced</span>
								{/if}
								<span class="summary">{node.summary}</span>
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</li>
					{/each}
				</ol>
			{/each}
		</li>
	{/each}
</ol>

<style>
	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		margin-bottom: 20px;
		font-size: 13px;
	}

	.track {
		margin-bottom: 26px;
		scroll-margin-top: 12px;
	}

	h2 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
	}

	.lead {
		margin: 1px 0 8px;
		color: var(--muted);
		font-size: 13px;
	}

	/* A thin line, and each question a stop on it. The words do the work. */
	.chain {
		margin-left: 4px;
		border-left: 1px solid var(--strong-line);
	}

	.chain + .chain {
		margin-top: 10px;
	}

	.stop {
		position: relative;
		display: block;
		padding: 3px 0 3px 16px;
		color: var(--fg);
		font-size: 14px;
		line-height: 1.35;
		text-decoration: none;
	}

	.stop::before {
		content: '';
		position: absolute;
		top: 9px;
		left: -4px;
		width: 7px;
		height: 7px;
		box-sizing: border-box;
		border: 1px solid var(--strong-line);
		border-radius: 50%;
		background: var(--bg);
	}

	.stop:hover .title,
	.stop:focus-visible .title {
		text-decoration: underline;
	}

	.stop.showing::before,
	.stop[aria-current='location']::before {
		border-color: var(--accent);
		background: var(--accent);
	}

	.stop.showing .title,
	.stop[aria-current='location'] .title {
		color: var(--accent);
	}

	.tag {
		margin-left: 6px;
		color: var(--muted);
		font-size: 11.5px;
	}

	/* Beside the diagram, the diagram says it. Still there for anyone who cannot see that. */
	@media (min-width: 1100px) {
		.summary {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}

	@media (max-width: 1099px) {
		.summary {
			display: block;
			color: var(--muted);
			font-size: 13px;
		}
	}
</style>
