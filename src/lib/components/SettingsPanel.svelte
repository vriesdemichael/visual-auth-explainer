<script lang="ts">
	import {
		isOffered,
		settingDefs,
		settingIds,
		unavailable,
		type SettingDef,
		type SettingId,
		type Settings
	} from '#lib/flow/settings.ts';
	import { refLabel, type SourceRef } from '#lib/sources/sources.ts';

	interface Props {
		settings: Settings;
		onchange: <K extends SettingId>(id: K, value: Settings[K]) => void;
		onopensource: (setting: SettingId, ref: SourceRef) => void;
	}

	let { settings, onchange, onopensource }: Props = $props();

	const offered = $derived(settingIds.filter((id) => isOffered(id, settings)));
	const defOf = (id: SettingId): SettingDef => settingDefs[id];
	const set = (id: SettingId, value: boolean | string) => onchange(id, value as never);
	const blockedBy = (id: SettingId, value: string) =>
		unavailable(id, value as never, settings)?.because;
</script>

<h2>Settings</h2>
{#each offered as id (id)}
	{@const def = defOf(id)}
	<section data-setting={id}>
		{#if def.kind === 'toggle'}
			<label class="toggle">
				<input
					type="checkbox"
					checked={settings[id] === true}
					onchange={(event) => set(id, event.currentTarget.checked)}
				/>
				{def.label}
			</label>
		{:else}
			<fieldset>
				<legend>{def.label}</legend>
				{#each def.options as option (option.value)}
					{@const blocked = blockedBy(id, option.value)}
					<label class:blocked title={blocked}>
						<input
							type="radio"
							name={id}
							value={option.value}
							checked={settings[id] === option.value}
							disabled={blocked !== undefined}
							onchange={() => set(id, option.value)}
						/>
						{option.label}
						{#if blocked}<small>{blocked}</small>{/if}
					</label>
				{/each}
			</fieldset>
		{/if}
		<p>{def.summary}</p>
		<ul class="sources">
			{#each def.sources as ref (ref.source)}
				<li>
					<button
						type="button"
						data-source-ref={`${id}:${ref.source}`}
						onclick={() => onopensource(id, ref)}
					>
						{refLabel(ref)}
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<style>
	h2 {
		margin: 0 0 12px;
		font-size: 13px;
		font-weight: 600;
		color: var(--muted);
	}

	section {
		margin-bottom: 16px;
	}

	label {
		display: block;
		cursor: pointer;
	}

	.toggle,
	legend {
		font-weight: 600;
	}

	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}

	legend {
		padding: 0;
	}

	.blocked {
		color: var(--muted);
		cursor: default;
	}

	small {
		display: block;
		margin-left: 22px;
		font-size: 11.5px;
	}

	p {
		margin: 3px 0 0;
		color: var(--muted);
		font-size: 12px;
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 10px;
		margin: 3px 0 0;
		padding: 0;
		list-style: none;
	}

	.sources button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font-size: 11.5px;
		text-align: left;
		text-decoration: underline;
	}
</style>
