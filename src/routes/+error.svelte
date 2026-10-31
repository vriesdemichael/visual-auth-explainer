<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status}</title>
</svelte:head>

<main>
	<h1>{page.status}</h1>
	<p>Nothing here. <a href={resolve('/')}>Back to the start.</a></p>
</main>

<style>
	main {
		max-width: 640px;
		margin: 48px auto;
		padding: 0 16px;
	}
</style>
