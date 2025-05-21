import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		tsconfigPaths(),
		tailwindcss(),
	],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
	},
	server: {
		watch: {
			ignored: (input) =>
				input.includes("/docs/") ||
				input.includes("/convex/") ||
				input.includes("/scripts/"),
		},
	},
})
