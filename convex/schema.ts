import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v, type Validator } from "convex/values"

export default defineSchema({
	...authTables,

	characters: defineTable({
		name: v.optional(v.string()),
		data: v.optional(v.record(v.string(), v.union(v.string(), v.number()))),
		bonds: v.optional(
			v.array(
				v.object({
					name: v.string(),
					description: v.string(),
					strength: v.number(),
					aura: v.optional(v.string()),
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
		ownerId: v.id("users"),
	}).index("ownerId", ["ownerId", "name"]),

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
	}).index("roomId", ["roomId", "characterId"]),

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
