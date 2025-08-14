import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
	index("./routes/home.route.tsx"),
	route("rooms/:slug", "./routes/room.route.tsx"),
	route("account/settings", "./routes/account-settings.route.tsx"),
] satisfies RouteConfig
