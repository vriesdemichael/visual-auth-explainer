<script lang="ts">
	import MiniDiagram from '#lib/components/MiniDiagram.svelte';
	import {
		nodeBaseView,
		nodeState,
		nodeView,
		type MapNode,
		type MapTrack
	} from '#lib/map/nodes.ts';

	interface Props {
		tracks: readonly MapTrack[];
		hrefOf: (node: MapNode) => string;
		/** The node someone came back from, to mark where they were. */
		current?: string | null;
	}

	let { tracks, hrefOf, current = null }: Props = $props();
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
								class="node"
								href={hrefOf(node)}
								data-testid={`node-${node.id}`}
								aria-current={current === node.id ? 'location' : undefined}
							>
								<MiniDiagram
									view={nodeView(node)}
									base={nodeBaseView(node)}
									about={node.step ? nodeState(node).step : null}
								/>
								<strong>{node.title}</strong>
								<span class="summary">{node.summary}</span>
								{#if node.mode === 'advanced'}
									<span class="tag">Advanced</span>
								{/if}
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
		gap: 4px 16px;
		margin-bottom: 18px;
		font-size: 13px;
	}

	/* One line everything branches off, because everything builds on the same flow. */
	.tracks {
		position: relative;
		padding-left: 26px;
		border-left: 2px solid var(--strong-line);
	}

	.track {
		position: relative;
		padding-bottom: 30px;
		scroll-margin-top: 12px;
	}

	.track::before {
		content: '';
		position: absolute;
		top: 6px;
		left: -33px;
		width: 12px;
		height: 12px;
		border: 2px solid var(--strong-line);
		border-radius: 50%;
		background: var(--bg);
	}

	h2 {
		margin: 0;
		font-size: 17px;
		font-weight: 600;
	}

	.lead {
		margin: 2px 0 12px;
		color: var(--muted);
	}

	.chain {
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: 18px;
		margin-bottom: 18px;
	}

	.chain > li {
		position: relative;
		display: flex;
		flex: 0 1 250px;
		min-width: 200px;
	}

	/* Each one builds on the one before it. */
	.chain > li + li::before {
		content: '';
		position: absolute;
		top: 34px;
		left: -18px;
		width: 18px;
		border-top: 2px solid var(--strong-line);
	}

	.node {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px 12px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--raised);
		color: var(--fg);
		text-decoration: none;
	}

	.node:hover {
		border-color: var(--strong-line);
	}

	.node[aria-current] {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
		background: var(--accent-soft);
	}

	strong {
		font-weight: 600;
		line-height: 1.3;
	}

	.summary {
		color: var(--muted);
		font-size: 12.5px;
		line-height: 1.4;
	}

	.node[aria-current] .summary {
		color: var(--fg);
	}

	.tag {
		margin-top: auto;
		align-self: flex-start;
		padding: 0 7px;
		border: 1px solid var(--strong-line);
		border-radius: 8px;
		color: var(--muted);
		font-size: 11px;
	}

	.node[aria-current] .tag {
		color: var(--fg);
	}

	@media (max-width: 720px) {
		.chain {
			flex-direction: column;
			align-items: stretch;
		}

		.chain > li {
			flex: none;
		}

		.chain > li + li::before {
			display: none;
		}
	}
</style>
