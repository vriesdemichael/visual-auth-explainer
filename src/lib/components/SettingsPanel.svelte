<script lang="ts">
	import {
		defaultSettings,
		isOffered,
		settingDefs,
		settingIds,
		simpleSettingIds,
		unavailable,
		type SettingDef,
		type SettingId,
		type Settings
	} from '#lib/flow/settings.ts';
	import type { Mode } from '#lib/flow/vocabulary.ts';
	import { flagStatus } from '#lib/recordings/known.ts';
	import { isVendorSource, refLabel, type SourceRef } from '#lib/sources/sources.ts';

	interface Props {
		settings: Settings;
		mode?: Mode;
		onchange: <K extends SettingId>(id: K, value: Settings[K]) => void;
		onopensource: (setting: SettingId, ref: SourceRef) => void;
		onexplain?: (setting: SettingId) => void;
		/** Whether to show what is specific to the server this was recorded from. */
		serverNotes?: boolean;
		onservernotes?: (on: boolean) => void;
	}

	let {
		settings,
		mode = 'advanced',
		onchange,
		onopensource,
		onexplain,
		serverNotes = true,
		onservernotes
	}: Props = $props();

	const simple = $derived(mode === 'simple');
	const offered = $derived(
		(simple ? simpleSettingIds : settingIds).filter((id) => isOffered(id, settings))
	);
	// An advanced setting stays on in simple mode, as a chip that says so (ADR-004).
	const alsoOn = $derived(
		simple
			? settingIds.filter(
					(id) => !simpleSettingIds.includes(id) && settings[id] !== defaultSettings[id]
				)
			: []
	);

	const defOf = (id: SettingId): SettingDef => settingDefs[id];
	const set = (id: SettingId, value: boolean | string) => onchange(id, value as never);
	const blockedBy = (id: SettingId, value: string) =>
		unavailable(id, value as never, settings)?.because;
	function chipText(id: SettingId) {
		const def = defOf(id);
		if (def.kind === 'toggle') return def.label;
		return `${def.label}: ${def.options.find((option) => option.value === settings[id])?.label}`;
	}
</script>

<h2>{simple ? 'Try changing' : 'Settings'}</h2>
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
				{simple ? (def.simple?.label ?? def.label) : def.label}
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
						{#if !simple && serverNotes && option.flag}
							<small class="flag" data-flag={option.flag.name}>
								Keycloak flag <code>{option.flag.name}</code>: {flagStatus(option.flag)}
							</small>
						{/if}
					</label>
				{/each}
			</fieldset>
		{/if}
		<p>{simple ? (def.simple?.summary ?? def.summary) : def.summary}</p>
		<ul class="more">
			<li>
				<button
					type="button"
					class="link"
					data-why={id}
					aria-label={`Why ${simple ? (def.simple?.label ?? def.label) : def.label}?`}
					onclick={() => onexplain?.(id)}
				>
					Why?
				</button>
			</li>
			{#if !simple}
				{#each def.sources.filter((ref) => serverNotes || !isVendorSource(ref.source)) as ref (ref.source)}
					<li>
						<button
							type="button"
							class="link"
							data-source-ref={`${id}:${ref.source}`}
							onclick={() => onopensource(id, ref)}
						>
							{refLabel(ref)}
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	</section>
{/each}

{#if !simple}
	<section data-testid="server-notes">
		<label class="toggle">
			<input
				type="checkbox"
				checked={serverNotes}
				onchange={(event) => onservernotes?.(event.currentTarget.checked)}
			/>
			Server notes
		</label>
		<p>
			Which setting controls each message, on the server this was recorded from. Off, it is the
			protocol and nothing else.
		</p>
	</section>
{/if}

{#if alsoOn.length}
	<section class="also" data-testid="also-on">
		<h3>Also on, from advanced</h3>
		<ul>
			{#each alsoOn as id (id)}
				<li>
					{chipText(id)}
					<button
						type="button"
						class="remove"
						data-remove={id}
						aria-label={`Turn off ${defOf(id).label}`}
						onclick={() => set(id, defaultSettings[id])}
					>
						×
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	h2 {
		margin: 0 0 10px;
		font-size: 13px;
		font-weight: 600;
		color: var(--muted);
	}

	section {
		padding: 10px 0;
		border-top: 1px solid var(--line);
	}

	label {
		display: block;
		cursor: pointer;
	}

	.toggle,
	legend {
		font-weight: 600;
	}

	.toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-direction: row-reverse;
		gap: 8px;
	}

	.toggle input {
		appearance: none;
		flex: none;
		position: relative;
		width: 32px;
		height: 18px;
		margin: 0;
		border-radius: 9px;
		background: var(--strong-line);
		cursor: pointer;
		transition: background 0.15s;
	}

	.toggle input::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--bg);
		transition: transform 0.15s;
	}

	.toggle input:checked {
		background: var(--accent);
	}

	.toggle input:checked::after {
		transform: translateX(14px);
	}

	input[type='radio'] {
		accent-color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.toggle input,
		.toggle input::after {
			transition: none;
		}
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

	.flag {
		color: var(--muted);
		overflow-wrap: anywhere;
	}

	p {
		margin: 3px 0 0;
		color: var(--muted);
		font-size: 12px;
	}

	.more {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 10px;
		margin: 3px 0 0;
		padding: 0;
		list-style: none;
	}

	.link {
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font-size: 11.5px;
		text-align: left;
		text-decoration: underline;
	}

	.also h3 {
		margin: 0 0 4px;
		font-size: 12px;
		font-weight: 600;
		color: var(--muted);
	}

	.also ul {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.also li {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 1px 4px 1px 10px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--raised);
		font-size: 12px;
	}

	.remove {
		padding: 0 4px;
		border: 0;
		background: none;
		color: var(--muted);
		line-height: 1;
	}
</style>
