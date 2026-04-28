import { defineConfig } from "vitest/config";

export default defineConfig({
  // Disable PostCSS so Tailwind config (which exists for Next.js, not Vitest)
  // does not run during tests. Lint tests are pure Node code; no CSS needed.
  css: { postcss: { plugins: [] } },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
