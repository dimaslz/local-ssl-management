import { resolve } from 'path';
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [dts({ include: ["src"] })],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'index',
			fileName: 'index',
			formats: ["cjs", "es", "umd"],
		},
		ssr: true
	},
});
