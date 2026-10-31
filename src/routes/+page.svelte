<script lang="ts">
	import { resolve } from '$app/paths';
	import { flows, presets } from '#lib/flow/index.ts';
	import { presetSearch } from '#lib/flow/state.ts';

	const link = (flow: string, settings: (typeof presets)[number]['settings']) => {
		const search = presetSearch(flows[flow], settings);
		return resolve('/[flow]', { flow }) + (search ? `?${search}` : '');
	};
</script>

<svelte:head>
	<title>Visual auth explainer</title>
	<meta name="description" content="Explore OAuth and OpenID Connect on one living diagram." />
</svelte:head>

<main>
	<h1>Visual auth explainer</h1>
	<p>Step 0 prototype. The map comes later, so for now these are the states to open.</p>
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
		max-width: 640px;
		margin: 48px auto;
		padding: 0 16px;
	}
</style>
