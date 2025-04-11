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
	server: {
		headers: {
			"Access-Control-Allow-Origin": "https://www.owlbear.rodeo",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
	},
})
