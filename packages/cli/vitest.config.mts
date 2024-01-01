import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.mts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "node",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
);
