import type { Config } from "@react-router/dev/config"

export default {
	ssr: false,
	appDirectory: "src",
	future: {
		unstable_optimizeDeps: true,
		unstable_viteEnvironmentApi: true,
	},
} satisfies Config
