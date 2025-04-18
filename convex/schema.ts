import { defineSchema, defineTable } from "convex/server"
import { v, type Validator } from "convex/values"

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
		clientData: v.optional(v.any() as Validator<unknown, "required">),
		name: v.optional(v.string()),
		data: v.optional(v.record(v.string(), v.union(v.string(), v.number()))),
		bonds: v.optional(
			v.array(
				v.object({
					name: v.string(),
					description: v.string(),
					strength: v.number(),
					aura: v.optional(v.union(v.string(), v.null())),
				}),
			),
		),
		items: v.optional(
			v.array(
				v.object({
					name: v.string(),
					description: v.string(),
				}),
			),
		),
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
