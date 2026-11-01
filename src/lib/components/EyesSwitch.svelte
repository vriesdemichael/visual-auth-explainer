<script lang="ts">
	interface Props {
		/** Who can be picked, by what this mode calls them. */
		parties: readonly { id: string; name: string }[];
		current: string | null;
		onchange: (party: string | null) => void;
	}

	let { parties, current, onchange }: Props = $props();
</script>

<label data-testid="eyes-switch">
	See it as
	<select
		data-testid="eyes"
		value={current ?? ''}
		onchange={(event) => onchange(event.currentTarget.value || null)}
	>
		<option value="">everyone</option>
		{#each parties as party (party.id)}
			<option value={party.id}>{party.name}</option>
		{/each}
	</select>
</label>

<style>
	label {
		flex: none;
		color: var(--muted);
		font-size: 12px;
		white-space: nowrap;
	}

	select {
		max-width: 130px;
		padding: 1px 2px;
		border: 1px solid var(--line);
		border-radius: 5px;
		background: var(--bg);
		color: var(--fg);
		font-size: 12px;
	}
</style>
