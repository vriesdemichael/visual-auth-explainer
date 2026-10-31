<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Workspace from '#lib/components/Workspace.svelte';
	import { flows } from '#lib/flow/index.ts';
	import { parseState, serializeState, type AppState } from '#lib/flow/state.ts';

	let { data } = $props();

	// The query string does not exist while prerendering, so the first render is the default state.
	let mounted = $state(false);
	let settled = $state(false);

	onMount(async () => {
		mounted = true;
		await tick();
		document.documentElement.classList.remove('pending');
		settled = true;
	});

	const flow = $derived(flows[data.flowId]);
	const fromUrl = $derived(parseState(flow, mounted ? page.url.search : ''));

	// The state changes at once and the URL catches up, so quick key presses are not lost.
	let ahead = $state.raw<AppState | null>(null);
	const appState = $derived(ahead ?? fromUrl);

	async function navigate(next: AppState, history: 'push' | 'replace') {
		ahead = next;
		const search = serializeState(flow, next);
		const target = resolve('/[flow]', { flow: flow.id }) + (search ? `?${search}` : '');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved above
		await goto(target, { replace: history === 'replace', reset: false });
		if (ahead === next) ahead = null;
	}
</script>

<svelte:head>
	<title>{flow.title}</title>
	<meta name="description" content={flow.summary} />
</svelte:head>

<Workspace
	{flow}
	state={appState}
	animate={settled}
	homeHref={resolve('/')}
	onnavigate={navigate}
/>
