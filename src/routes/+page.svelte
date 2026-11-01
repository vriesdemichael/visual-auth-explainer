<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import LearningMap from '#lib/components/LearningMap.svelte';
	import Mark from '#lib/components/Mark.svelte';
	import { mapTracks, type MapNode } from '#lib/map/nodes.ts';
	import { searchState } from '#lib/search/open.svelte.ts';
	import { sharingTags, SITE_NAME } from '#lib/site.ts';

	// The query string does not exist while prerendering, so where someone came from is marked after.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const current = $derived(mounted ? page.url.searchParams.get('at') : null);
	const DESCRIPTION =
		"OAuth and OpenID Connect on one living diagram, with its messages recorded from a real Keycloak, a free identity provider you can run yourself. The specs are the same elsewhere, though error codes, token formats, defaults and the stored-token API are Keycloak's own. Pick a question and follow it, one message at a time.";
	const TITLE = `${SITE_NAME}: OAuth and OpenID Connect on one living diagram`;
	const sharing = sharingTags({
		title: TITLE,
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
	<title>{TITLE}</title>
	<meta name="description" content={DESCRIPTION} />
	{#each sharing as tag (tag.property ?? tag.name)}
		<meta {...tag} />
	{/each}
</svelte:head>

<main data-ready={mounted}>
	<h1><Mark size={32} />{SITE_NAME}</h1>
	<p class="lead">
		OAuth and OpenID Connect on one living diagram, with its messages recorded from a real Keycloak,
		a free identity provider you can run yourself. The specs are the same elsewhere, though error
		codes, token formats, defaults and the stored-token API are Keycloak's own. Pick a question and
		follow it, one message at a time. New to this? Start with the first one.
	</p>
	<button
		type="button"
		class="search"
		data-testid="open-search"
		onclick={() => (searchState.open = true)}
	>
		Search for a word, a question, or an error on your screen
		<kbd>/</kbd>
	</button>
	<LearningMap tracks={mapTracks} {hrefOf} {current} />
</main>

<style>
	main {
		max-width: 1120px;
		margin: 56px auto;
		padding: 0 16px;
	}

	h1 {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0 0 8px;
		font-size: 34px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.search {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		box-sizing: border-box;
		width: min(680px, 100%);
		margin: 0 0 28px;
		padding: 8px 12px;
		color: var(--muted);
		text-align: left;
	}

	kbd {
		padding: 0 6px;
		border: 1px solid var(--line);
		border-radius: 4px;
		font: inherit;
		font-size: 12px;
	}

	.lead {
		max-width: 680px;
		margin: 0 0 20px;
		color: var(--muted);
		font-size: 16px;
	}
</style>
