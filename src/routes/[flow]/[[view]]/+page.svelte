<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import Workspace from '#lib/components/Workspace.svelte';
	import { flows } from '#lib/flow/index.ts';
	import { parseState, serializeState, type AppState } from '#lib/flow/state.ts';
	import { nodeMatching, nodeSearch } from '#lib/map/nodes.ts';
	import type { Recording } from '#lib/recordings/format.ts';
	import { loadsOnce } from '#lib/recordings/load.ts';

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
	const added = $derived(mounted ? page.url.search : '');
	const fromUrl = $derived(
		parseState(base, data.diagram, data.node ? nodeSearch(data.node, added) : added)
	);

	// The state changes at once and the URL catches up, so quick key presses are not lost.
	let ahead = $state.raw<AppState | null>(null);
	const appState = $derived(ahead ?? fromUrl);
	const flow = $derived(base.diagrams[appState.diagram]);

	const here = $derived(nodeMatching(appState));

	function hrefFor(state: AppState) {
		const search = serializeState(base, state);
		const view = state.diagram === 'setup' ? 'setup' : undefined;
		return resolve('/[flow]/[[view]]', { flow: base.id, view }) + (search ? `?${search}` : '');
	}

	async function loadText(file: string) {
		const response = await fetch(asset(`/rfc/${file}` as Parameters<typeof asset>[0]));
		if (!response.ok) throw new Error(`${file}: ${response.status}`);
		return response.text();
	}

	const fetchRecording = loadsOnce(async (path) => {
		const response = await fetch(asset(path as Parameters<typeof asset>[0]));
		if (!response.ok) throw new Error(`${path}: ${response.status}`);
		return (await response.json()) as Recording;
	});
	const loadRecording = (preset: string) => fetchRecording(`/recordings/${base.id}/${preset}.json`);

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
	<title>{data.node?.title ?? flow.title}</title>
	<meta name="description" content={data.node?.summary ?? flow.summary} />
</svelte:head>

<Workspace
	{base}
	state={appState}
	animate={settled}
	homeHref={resolve('/') + (here ? `?at=${here.id}` : '')}
	{hrefFor}
	{loadText}
	{loadRecording}
	onnavigate={navigate}
/>
