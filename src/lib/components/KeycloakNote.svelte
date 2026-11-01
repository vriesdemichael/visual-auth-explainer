<script lang="ts">
	import type { Note } from '#lib/keycloak/notes.ts';
	import { flagStatus } from '#lib/keycloak/flags.ts';

	interface Props {
		note: Note;
		/** The version all of this was checked against. */
		version: string;
	}

	let { note, version }: Props = $props();
</script>

<details class="note" data-testid="keycloak-note" data-note={note.id}>
	<summary><span class="in">In Keycloak:</span> {note.title}</summary>
	<p>{note.text}</p>
	{#if note.path}
		<p class="path" data-testid="note-path">{note.path.join(' › ')}</p>
	{/if}
	{#if note.serverOption}
		<p class="path"><code>{note.serverOption}</code></p>
	{/if}
	{#if note.flag}
		<p class="flag" data-flag={note.flag.name}>
			Flag <code>{note.flag.name}</code>: {flagStatus(note.flag)}
		</p>
	{/if}
	<p class="checked">{note.evidence} Keycloak {version}.</p>
</details>

<style>
	.note {
		margin: 0 0 6px;
		padding: 6px 10px;
		border: 1px solid var(--line);
		border-left: 3px solid var(--strong-line);
		border-radius: 6px;
		font-size: 12.5px;
	}

	summary {
		cursor: pointer;
		font-weight: 600;
	}

	.in {
		color: var(--muted);
		font-weight: 500;
	}

	p {
		margin: 6px 0 0;
	}

	.path {
		font-weight: 500;
	}

	.flag,
	.checked {
		color: var(--muted);
		font-size: 11.5px;
	}
</style>
