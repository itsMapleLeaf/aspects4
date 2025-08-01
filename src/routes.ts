import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
	index("./features/rooms/RoomList.route.tsx"),
	route("rooms/:slug", "./features/rooms/Room.route.tsx"),
	// route("/templates", "./features/templates/TemplatesHome.route.tsx"),
	route("account/settings", "./features/user/AccountSettings.route.tsx"),
] satisfies RouteConfig
