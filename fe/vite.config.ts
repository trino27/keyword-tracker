import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: { tsconfigPaths: true },

	server: {
		port: 5173,
		strictPort: true,
		/**
		 * `/api` is proxied so the dev server is one origin with the backend, exactly as
		 * Caddy makes it in docker: a session cookie stays first-party and nothing needs
		 * CORS. Without it, Vite would answer `/api/...` with its own index.html — a 200
		 * of HTML that every response schema rejects.
		 */
		proxy: {
			"/api": { target: "http://localhost:3000", changeOrigin: false },
		},
	},

	build: {
		outDir: "dist",
		sourcemap: true,
	},

	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
		// Toronto, the user's zone — deliberately not UTC: at UTC the local clock equals
		// the absolute one, so a test that confuses the two passes by coincidence.
		env: { TZ: "America/Toronto" },
	},
});
