import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/client/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/client/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
