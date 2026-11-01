<script lang="ts">
	import '../app.css';
	import { INDEXABLE } from '#lib/site.ts';

	let { children } = $props();
</script>

<svelte:head>
	{#if !INDEXABLE}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

{@render children()}
