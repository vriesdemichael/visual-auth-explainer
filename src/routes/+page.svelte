<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import LearningMap from '#lib/components/LearningMap.svelte';
	import { mapTracks, type MapNode } from '#lib/map/nodes.ts';
	import { sharingTags } from '#lib/site.ts';

	// The query string does not exist while prerendering, so where someone came from is marked after.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const current = $derived(mounted ? page.url.searchParams.get('at') : null);
	const DESCRIPTION =
		'OAuth and OpenID Connect on one living diagram, with its messages recorded from a real Keycloak. The protocol is the same on other providers. Pick a question and follow it, one message at a time.';
	const sharing = sharingTags({
		title: 'Visual auth explainer',
		description: DESCRIPTION,
		path: '/'
	});
	const hrefOf = (node: MapNode) => resolve('/[flow]/[[view]]', { flow: node.flow, view: node.id });

	// After the navigation, which otherwise puts the page back at the top.
	afterNavigate(async () => {
		await tick();
		document.querySelector('[aria-current="location"]')?.scrollIntoView({ block: 'center' });
	});
</script>

<svelte:head>
	<title>Visual auth explainer</title>
	<meta name="description" content={DESCRIPTION} />
	{#each sharing as tag (tag.property ?? tag.name)}
		<meta {...tag} />
	{/each}
</svelte:head>

<main data-ready={mounted}>
	<h1>Visual auth explainer</h1>
	<p class="lead">
		OAuth and OpenID Connect on one living diagram, with its messages recorded from a real Keycloak.
		The protocol is the same on other providers. Pick a question and follow it, one message at a
		time. New to this? Start with the first one.
	</p>
	<LearningMap tracks={mapTracks} {hrefOf} {current} />
</main>

<style>
	main {
		max-width: 1120px;
		margin: 56px auto;
		padding: 0 16px;
	}

	h1 {
		margin: 0 0 8px;
		font-size: 34px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.lead {
		max-width: 680px;
		margin: 0 0 32px;
		color: var(--muted);
		font-size: 16px;
	}
</style>
