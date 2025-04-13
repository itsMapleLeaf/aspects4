import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	rooms: defineTable({
		name: v.string(),
		slug: v.string(),
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
		name: v.string(),
		data: v.record(v.string(), v.union(v.string(), v.number())),
		bonds: v.optional(
			v.array(
				v.object({
					name: v.string(),
					description: v.string(),
					strength: v.number(),
				}),
			),
		),
	})
		.index("roomId", ["roomId", "name"])
		.index("key", ["key", "name"])
		.index("name", ["name"]),

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
