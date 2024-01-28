import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.mts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "node",
      setupFiles: "./global-setup.ts",
      snapshotFormat: {
        escapeString: false,
        printBasicPrototype: false,
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
);
