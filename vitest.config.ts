import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Tailwind v4 uses @tailwindcss/postcss for the Next build. We don't load
  // CSS in tests, so disable PostCSS to keep Vitest's import graph cheap.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
    environment: "node",
  },
});
