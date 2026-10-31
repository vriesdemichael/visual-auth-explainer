// Regenerates the screenshot baselines in the image CI runs in, since fonts render differently
// elsewhere. Run this after a deliberate change to the look, and read the new images before committing.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const image = readFileSync('.github/workflows/ci.yml', 'utf8').match(/container: (\S+)/)?.[1];
if (!image) throw new Error('No container image in ci.yml');

const inside = [
	'corepack enable',
	'pnpm install --frozen-lockfile --ignore-scripts --store-dir /tmp/pnpm-store',
	'pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots=all'
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
