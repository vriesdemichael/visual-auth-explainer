<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ErrorMessage from '#lib/components/ErrorMessage.svelte';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page not found' : 'That did not load'}</title>
</svelte:head>

<ErrorMessage status={page.status} homeHref={resolve('/')} onretry={() => location.reload()} />
