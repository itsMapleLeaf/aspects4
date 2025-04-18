import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	...authTables,

	rooms: defineTable({
		name: v.string(),
		slug: v.string(),
		backgroundId: v.optional(v.union(v.id("_storage"), v.null())),
		ownerId: v.optional(v.id("users")),
		memberUserIds: v.optional(v.array(v.id("users"))),
	})
		.index("name", ["name"])
		.index("slug", ["slug"]),

	messages: defineTable({
		sender: v.string(),
		content: v.string(),
		roomId: v.id("rooms"),
	}).index("roomId", ["roomId"]),

	characters: defineTable({
		roomId: v.id("rooms"),
		key: v.string(),
		clientData: v.optional(v.any()),
	})
		.index("roomId", ["roomId", "clientData.name"])
		.index("key", ["key", "roomId", "clientData.name"]),

	assets: defineTable({
		name: v.string(),
		type: v.string(),
		fileId: v.id("_storage"),
		roomId: v.id("rooms"),
		position: v.object({
			x: v.number(),
			y: v.number(),
		}),
		size: v.optional(
			v.object({
				width: v.number(),
				height: v.number(),
			}),
		),
		rotation: v.optional(v.number()),
		locked: v.optional(v.boolean()),
		updatedAt: v.number(),
	}).index("roomId", ["roomId"]),
})
