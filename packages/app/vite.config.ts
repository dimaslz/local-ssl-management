import path from "path";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./"),
			"@": path.resolve(__dirname, "src"),
		},
	},
});
