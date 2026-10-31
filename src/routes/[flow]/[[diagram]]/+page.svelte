<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
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

	const base = $derived(flows[data.flowId]);
	const fromUrl = $derived(parseState(base, data.diagram, mounted ? page.url.search : ''));

	// The state changes at once and the URL catches up, so quick key presses are not lost.
	let ahead = $state.raw<AppState | null>(null);
	const appState = $derived(ahead ?? fromUrl);
	const flow = $derived(base.diagrams[appState.diagram]);

	function hrefFor(state: AppState) {
		const search = serializeState(base, state);
		const diagram = state.diagram === 'setup' ? 'setup' : undefined;
		return (
			resolve('/[flow]/[[diagram]]', { flow: base.id, diagram }) + (search ? `?${search}` : '')
		);
	}

	async function navigate(next: AppState, history: 'push' | 'replace') {
		ahead = next;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor resolves it
		await goto(hrefFor(next), { replace: history === 'replace', reset: false });
		if (ahead === next) ahead = null;
	}

	// Older links name setup in the query, or a step from the other diagram (ADR-003).
	$effect(() => {
		if (!mounted) return;
		const outdated = fromUrl.diagram !== data.diagram || page.url.searchParams.has('setup');
		if (outdated) untrack(() => navigate(fromUrl, 'replace'));
	});
</script>

<svelte:head>
	<title>{flow.title}</title>
	<meta name="description" content={flow.summary} />
</svelte:head>

<Workspace
	{base}
	state={appState}
	animate={settled}
	homeHref={resolve('/')}
	{hrefFor}
	onnavigate={navigate}
/>
