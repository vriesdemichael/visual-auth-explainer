<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import CopyBlock from '#lib/components/CopyBlock.svelte';
	import Mark from '#lib/components/Mark.svelte';
	import { authorizationCodeBase as base } from '#lib/flow/index.ts';
	import { parseState } from '#lib/flow/state.ts';
	import { recordedIndex } from '#lib/recordings/known.ts';
	import {
		PASSWORD,
		PASTE_CODE,
		PASTE_TOKEN,
		REDIRECT_URI,
		runYourself,
		USERNAME
	} from '#lib/recordings/run-yourself.ts';
	import { sharingTags, SITE_NAME } from '#lib/site.ts';

	// The query string does not exist while prerendering, so the first render is the plain case.
	let mounted = $state(false);
	onMount(() => (mounted = true));
	const search = $derived(mounted ? page.url.search : '');
	const settings = $derived(parseState(base, 'flow', search).settings);
	const commands = $derived(runYourself(settings, recordedIndex.keycloak));
	const backHref = $derived(`${resolve('/[flow]/[[view]]', { flow: base.id })}${search}`);

	const title = 'Run it yourself';
	const description = `The same server the recordings came from, on your own machine, in five minutes. Keycloak ${recordedIndex.keycloak}, with throwaway values.`;
</script>

<svelte:head>
	<title>{title}: {SITE_NAME}</title>
	<meta name="description" content={description} />
	{#each sharingTags( { title, description, path: '/run-it-yourself/' } ) as tag (tag.property ?? tag.name)}
		<meta {...tag} />
	{/each}
</svelte:head>

<main data-ready={mounted} data-testid="run-it-yourself">
	<p class="brand">
		<a href={resolve('/')}><Mark /> {SITE_NAME}</a>
		/
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved above -->
		<a href={backHref} data-testid="back-to-diagram">Back to the diagram</a>
	</p>
	<h1>{title}</h1>
	<p>
		This is the server the recordings came from, Keycloak {recordedIndex.keycloak}, with the same
		names. You need Docker, a browser and a terminal, and about five minutes. A real login, a real
		code in your own address bar, and real tokens.
	</p>
	<p class="warning" data-testid="throwaway">
		Everything here is a throwaway value for a server on your own machine. Never paste real secrets
		into these commands, and do not run this anywhere other people can reach it.
	</p>

	<p data-testid="fits-settings">
		These fit the settings you came from:
		{settings.clientType === 'public'
			? 'an app with no secret'
			: 'an app with a secret'}{settings.pkce ? ', PKCE' : ''}{settings.oidc
			? ', OpenID Connect'
			: ''}{settings.consent ? ', asking the user to agree' : ''}. Other settings are not part of
		this walk, and their recordings are on the diagram.
	</p>

	<h2>1. Start the server</h2>
	<p>
		In an empty folder. It stays running in that terminal, and it is ready when it says
		<code>Listening on: http://0.0.0.0:8080</code>.
	</p>
	<CopyBlock text={commands.start} label="the commands that start the server" />
	<p class="aside" data-testid="on-windows">
		On Windows, use WSL or Git Bash. In Git Bash, put <code>MSYS_NO_PATHCONV=1</code> in front of
		<code>docker run</code>, or it rewrites the path to the file.
	</p>

	<h2>2. Log in, in your browser</h2>
	<p>
		Open this address, and log in as <code>{USERNAME}</code> with the password
		<code>{PASSWORD}</code>.{#if settings.consent}
			Then agree to what the app is asking for.{/if}
	</p>
	<CopyBlock text={commands.login} label="the address to log in at" />
	<p>
		You end up at an error page, because nothing is listening at <code>{REDIRECT_URI}</code>. That
		is fine, and it is the point: <strong>look at your address bar.</strong> The code is right
		there, which is what passing through the browser means. Copy the value after <code>code=</code>,
		up to the next <code>&amp;</code>.
	</p>

	<h2>3. Trade the code for tokens</h2>
	<p>
		Put the code in place of <code>{PASTE_CODE}</code> and run this in another terminal. A code
		works once and does not last long, so if this says <code>invalid_grant</code>, log in again for
		a new one.
	</p>
	<CopyBlock text={commands.trade} label="the command that trades the code" />
	<p>The answer has your access token, which you can compare with the one on the diagram.</p>

	{#if commands.who}
		<h2>4. Ask who logged in</h2>
		<p>Put the access token in place of <code>{PASTE_TOKEN}</code>, and it says who you are.</p>
		<CopyBlock text={commands.who} label="the command that asks who logged in" />
	{/if}

	<h2>When you are done</h2>
	<p>Stop the server with Ctrl+C. It keeps nothing, and you can delete the folder.</p>
	<p class="checked">
		A scheduled job runs these same commands against this version of the server, so if they stop
		working, it fails.
	</p>
</main>

<style>
	main {
		max-width: 720px;
		margin: 24px auto;
		padding: 0 24px 40px;
	}

	.brand {
		color: var(--muted);
		font-size: 13px;
	}

	h1 {
		margin: 12px 0;
		font-size: 22px;
	}

	h2 {
		margin: 22px 0 6px;
		font-size: 15px;
	}

	p {
		margin: 0 0 8px;
		line-height: 1.5;
	}

	.warning {
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--panel);
		font-weight: 600;
	}

	.checked,
	.aside {
		color: var(--muted);
		font-size: 13px;
	}

	code {
		font-family: var(--mono);
		font-size: 0.92em;
	}
</style>
