import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v, type Validator } from "convex/values"

export default defineSchema({
	...authTables,

	characters: defineTable({
		ownerId: v.id("users"),
		roomId: optionull(v.id("rooms")),
		key: v.string(),
		clientData: v.optional(v.any()),
	})
		.index("roomId", ["roomId", "clientData.name"])
		.index("ownerId", ["ownerId", "clientData.name"])
		.index("key", ["key", "roomId", "clientData.name"]),

	rooms: defineTable({
		name: v.string(),
		slug: v.string(),
		backgroundId: optionull(v.id("_storage")),
		ownerId: v.optional(v.id("users")),
		memberUserIds: v.optional(v.array(v.id("users"))),
	})
		.index("name", ["name"])
		.index("slug", ["slug"]),

	roomCharacters: defineTable({
		roomId: v.id("rooms"),
		characterId: v.id("characters"),
	})
		.index("roomId", ["roomId"])
		.index("characterId", ["characterId"]),

	messages: defineTable({
		sender: v.string(),
		content: v.string(),
		roomId: v.id("rooms"),
	}).index("roomId", ["roomId"]),

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

function optionull<T, FieldPaths extends string>(
	validator: Validator<T, "required", FieldPaths>,
) {
	return v.optional(v.union(validator, v.null()))
}
