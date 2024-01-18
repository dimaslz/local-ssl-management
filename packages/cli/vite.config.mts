import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    minify: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "index",
      fileName: "index",
      formats: ["es"],
    },
    ssr: true,
  },
});
