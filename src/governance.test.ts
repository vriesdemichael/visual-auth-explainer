import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function filesUnder(folder: string): string[] {
	return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
		const path = join(folder, entry.name);
		return entry.isDirectory() ? filesUnder(path) : [path];
	});
}

describe('components (ADR-007, ADR-012)', () => {
	const components = filesUnder('src/lib').filter((file) => file.endsWith('.svelte'));

	it('exist, or these tests prove nothing', () => {
		expect(components.length).toBeGreaterThan(0);
	});

	it.each(components)('%s has stories', (component) => {
		expect(existsSync(component.replace(/\.svelte$/, '.stories.ts'))).toBe(true);
	});

	it('leave SvelteKit to the route files, because Storybook cannot render $app imports', () => {
		const offenders = filesUnder('src/lib').filter((file) =>
			/from ['"]\$app\//.test(readFileSync(file, 'utf8'))
		);
		expect(offenders).toEqual([]);
	});
});

describe('the screenshot baselines (ADR-006)', () => {
	it('come from the image for the version of Playwright in use', () => {
		const image = readFileSync('.github/workflows/ci.yml', 'utf8').match(/playwright:v([\d.]+)/);
		const lock = readFileSync('pnpm-lock.yaml', 'utf8').match(/'@playwright\/test@([\d.]+)'/);
		expect(image?.[1]).toBe(lock?.[1]);
	});
});

describe('decision records (ADR-002)', () => {
	const folder = 'docs/adr';
	const index = readFileSync(join(folder, 'index.md'), 'utf8');
	const records = readdirSync(folder).filter((name) => name !== 'index.md');

	it.each(records)('%s has the right shape and is in the index', (name) => {
		expect(name).toMatch(/^\d{3}-[a-z0-9]+(-[a-z0-9]+)*\.md$/);
		const text = readFileSync(join(folder, name), 'utf8');
		const title = text.split('\n')[0];
		expect(title).toMatch(new RegExp(`^# ADR-${name.slice(0, 3)}: \\S`));
		expect(index).toContain(`[${title.slice(2)}](${name})`);
		expect(text.endsWith('\n') && !text.endsWith('\n\n')).toBe(true);
		for (const line of text
			.split('\n')
			.filter((l) => l.startsWith('#'))
			.slice(1)) {
			expect(line).toBe('## Not chosen');
		}
	});

	it('are all mentioned by number only if they exist', () => {
		const numbers = new Set(records.map((name) => name.slice(0, 3)));
		const sources = [
			'CLAUDE.md',
			'docs/premise.md',
			...records.map((name) => join(folder, name)),
			...filesUnder('src'),
			...filesUnder('tests')
		];
		const mentioned = sources.flatMap((file) =>
			[...readFileSync(file, 'utf8').matchAll(/ADR-(\d{3})/g)].map((match) => match[1])
		);
		expect(mentioned.filter((number) => !numbers.has(number))).toEqual([]);
	});
});
