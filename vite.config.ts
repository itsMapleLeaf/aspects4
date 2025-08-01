import netlifyPlugin from "@netlify/vite-plugin-react-router"
import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import babel from "vite-plugin-babel"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [
		// @ts-expect-error: vite version conflict
		reactRouter(),
		// @ts-expect-error: vite version conflict
		tailwindcss(),
		// @ts-expect-error: vite version conflict
		babel({
			filter: /\.[jt]sx?$/,
			include: ["src/**"],
			babelConfig: {
				presets: ["@babel/preset-typescript"],
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		// @ts-expect-error: vite version conflict
		netlifyPlugin(),
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
