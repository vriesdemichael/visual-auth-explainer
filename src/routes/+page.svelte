<script lang="ts">
	import { resolve } from '$app/paths';
	import { flows, presets } from '#lib/flow/index.ts';
	import { presetSearch } from '#lib/flow/state.ts';

	const link = (flow: string, settings: (typeof presets)[number]['settings']) => {
		const search = presetSearch(flows[flow], settings);
		return resolve('/[flow]/[[diagram]]', { flow }) + (search ? `?${search}` : '');
	};
</script>

<svelte:head>
	<title>Visual auth explainer</title>
	<meta name="description" content="Explore OAuth and OpenID Connect on one living diagram." />
</svelte:head>

<main>
	<h1>Visual auth explainer</h1>
	<p class="lead">
		OAuth and OpenID Connect on one living diagram. A prototype: the map comes later, so for now
		these are the states to open.
	</p>
	<ul>
		{#each presets as preset (preset.id)}
			<li>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved in link() -->
				<a href={link(preset.flow, preset.settings)} data-testid={`preset-${preset.id}`}>
					{preset.title}
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	main {
		max-width: 720px;
		margin: 72px auto;
		padding: 0 16px;
	}

	h1 {
		margin: 0 0 8px;
		font-size: 34px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.lead {
		margin: 0 0 28px;
		color: var(--muted);
		font-size: 16px;
	}

	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		display: block;
		padding: 12px 14px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--raised);
		font-weight: 500;
		text-decoration: none;
	}

	a:hover {
		border-color: var(--accent);
	}
</style>
