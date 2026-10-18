import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": path.dirname(fileURLToPath(import.meta.url)) } },
  test: {
    include: ["tests/agentshelf/**/*.test.ts"],
    testTimeout: 30000,
    fileParallelism: false,
    environment: "node",
  },
});
