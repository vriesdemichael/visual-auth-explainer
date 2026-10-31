// Builds what GitHub Pages serves: the site, with its Storybook under it and the commit in both.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const env = { ...process.env, BASE_PATH: process.env.BASE_PATH ?? '/visual-auth-explainer' };
const run = (command) => execSync(command, { stdio: 'inherit', env });

// The site goes first, because the adapter empties the folder.
run('pnpm exec vite build');
run('pnpm exec storybook build --quiet --disable-telemetry --output-dir build/storybook');

const commit =
	process.env.GITHUB_SHA ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
for (const folder of ['build', 'build/storybook']) {
	writeFileSync(`${folder}/version.txt`, `${commit}\n`);
}
