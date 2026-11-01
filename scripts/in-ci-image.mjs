// Runs a command in the image CI runs in, which has every browser, and the fonts the screenshot
// baselines were made with. Read new baselines before committing them.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const image = readFileSync('.github/workflows/ci.yml', 'utf8').match(/container: (\S+)/)?.[1];
if (!image) throw new Error('No container image in ci.yml');

const command = process.argv.slice(2).join(' ');
const inside = [
	'corepack enable',
	'pnpm install --frozen-lockfile --ignore-scripts --store-dir /tmp/pnpm-store',
	command
].join(' && ');

execFileSync(
	'docker',
	[
		'run',
		'--rm',
		'--volume',
		`${process.cwd()}:/work`,
		// The checkout's own node_modules are for this machine, and may not run in Linux.
		'--volume',
		'visual-auth-explainer-node-modules:/work/node_modules',
		'--workdir',
		'/work',
		'--env',
		'GITHUB_SHA=0000000000000000000000000000000000000000',
		'--env',
		'CI=1',
		image,
		'sh',
		'-c',
		inside
	],
	{ stdio: 'inherit' }
);
