import process from 'node:process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({ fallback: '404.html' }),
			// GitHub Pages serves a project site from a subfolder, and a preview from a deeper one.
			paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` }
		})
	],
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
		// They work and wait for nothing, some across every combination, so a shorter limit than this
		// only says how busy the machine was. CI takes several times as long as a laptop.
		testTimeout: 60_000
	}
});
