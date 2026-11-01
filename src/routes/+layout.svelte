<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { INDEXABLE } from '#lib/site.ts';

	// What app.html waits for, to tell the application not starting from it merely being slow.
	onMount(() => {
		document.documentElement.setAttribute('data-started', '');
	});

	let { children } = $props();
</script>

<svelte:head>
	{#if !INDEXABLE}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

{@render children()}
