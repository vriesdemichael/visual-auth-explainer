<script lang="ts">
	import type { DiagramId } from '#lib/flow/model.ts';

	interface Props {
		current: DiagramId;
		hrefs: Readonly<Record<DiagramId, string>>;
	}

	let { current, hrefs }: Props = $props();

	const diagrams: readonly { id: DiagramId; label: string; caption: string }[] = [
		{ id: 'flow', label: 'User flow', caption: 'What happens when a user arrives.' },
		{ id: 'setup', label: 'Setup', caption: 'What people do before any user arrives.' }
	];
	const caption = $derived(diagrams.find((diagram) => diagram.id === current)?.caption);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- the route resolves these -->
<nav aria-label="Which diagram" data-testid="diagram-switch">
	{#each diagrams as diagram (diagram.id)}
		<a
			href={hrefs[diagram.id]}
			aria-current={diagram.id === current ? 'page' : undefined}
			data-diagram={diagram.id}
		>
			{diagram.label}
		</a>
	{/each}
	<p>{caption}</p>
</nav>

<style>
	nav {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		border-bottom: 1px solid var(--line);
	}

	a {
		padding: 3px 12px;
		border: 1px solid transparent;
		border-radius: 6px;
		color: var(--muted);
		font-weight: 600;
		text-decoration: none;
	}

	a:hover {
		border-color: var(--line);
	}

	a[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--accent);
	}

	p {
		margin: 0 0 0 12px;
		color: var(--muted);
		font-size: 12px;
	}
</style>
