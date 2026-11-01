// Breaks the code on purpose, one way at a time, and checks that a test notices. A review did this by
// hand once and 24 of 68 breakages went unnoticed, so a green suite meant less than it sounded like.
//
//   pnpm test:breakages         runs them all, and exits 1 if one goes unnoticed or no longer applies
//   pnpm test:breakages keys    only those whose name has that word in it
//
// Each one has to be a real mistake someone could make. A new test that exists to catch one adds it here.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { breakages } from './breakages.mjs';

const only = process.argv[2];
const chosen = breakages.filter((breakage) => !only || breakage.name.includes(only));

function testsFail() {
	try {
		execFileSync('pnpm', ['exec', 'vitest', 'run', '--bail=1'], { stdio: 'ignore', shell: true });
		return false;
	} catch {
		return true;
	}
}

if (testsFail()) {
	console.error('The tests fail before anything has been broken, so this would say nothing.');
	process.exit(1);
}

const unnoticed = [];
const stale = [];
for (const { name, file, from, to } of chosen) {
	const original = readFileSync(file, 'utf8');
	if (original.split(from).length !== 2) {
		stale.push(name);
		console.log(`? ${name}: that text is not in ${file} exactly once any more`);
		continue;
	}
	writeFileSync(
		file,
		original.replace(from, () => to)
	);
	try {
		const noticed = testsFail();
		if (!noticed) unnoticed.push(name);
		console.log(`${noticed ? 'ok' : 'UNNOTICED'} ${name}`);
	} finally {
		writeFileSync(file, original);
	}
}

console.log(
	`\n${chosen.length - unnoticed.length - stale.length} of ${chosen.length} noticed, ${unnoticed.length} unnoticed, ${stale.length} no longer apply.`
);
for (const name of unnoticed) console.log(`Unnoticed: ${name}`);
for (const name of stale) console.log(`No longer applies: ${name}`);
process.exit(unnoticed.length || stale.length ? 1 : 0);
