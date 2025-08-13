import netlifyPlugin from "@netlify/vite-plugin-react-router"
import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import babel from "vite-plugin-babel"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [
		reactRouter(),
		tailwindcss(),
		babel({
			filter: /\.[jt]sx?$/,
			include: ["src/**"],
			babelConfig: {
				presets: ["@babel/preset-typescript"],
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
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
