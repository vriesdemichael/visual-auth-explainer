<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import '../app.css';
	import SearchDialog from '#lib/components/SearchDialog.svelte';
	import type { Result } from '#lib/search/search.ts';
	import { INDEXABLE } from '#lib/site.ts';

	// What app.html waits for, to tell the application not starting from it merely being slow.
	onMount(() => {
		document.documentElement.setAttribute('data-started', '');
	});

	let { children } = $props();

	const resultHref = (result: Result) =>
		resolve('/[flow]/[[view]]', { flow: result.flow, view: result.view }) +
		(result.query ? `?${result.query}` : '');
</script>

<svelte:head>
	{#if !INDEXABLE}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

{@render children()}

<SearchDialog hrefOf={resultHref} mapHref={resolve('/')} />
