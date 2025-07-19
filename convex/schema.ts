import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { optionull, vector } from "./lib/validators.ts"

export default defineSchema({
	...authTables,

	characters: defineTable({
		name: v.optional(v.string()),
		data: v.optional(v.record(v.string(), v.any())),
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
			v.array(v.object({ name: v.string(), description: v.string() })),
		),
		ownerId: v.id("users"),
		roomId: v.optional(v.id("rooms")),
		isPublic: v.optional(v.boolean()),
	})
		.index("ownerId", ["ownerId", "name"])
		.index("roomId", ["roomId", "name"]),

	assets: defineTable({
		name: v.string(),
		type: v.string(),
		size: vector(),
		storageId: v.id("_storage"),
		ownerId: v.id("users"),
		// thumbnailId: v.id("_storage"), // TODO
	}).index("ownerId", ["ownerId", "name"]),

	rooms: defineTable({
		name: v.string(),
		slug: v.string(),
		backgroundAssetId: optionull(v.id("assets")),
		backgroundId: optionull(v.id("_storage")), // TODO: Remove this legacy field after migration
		ownerId: v.optional(v.id("users")),
		memberUserIds: v.optional(v.array(v.id("users"))),
	})
		.index("name", ["name"])
		.index("slug", ["slug"])
		.index("ownerId", ["ownerId"]),

	roomCharacters: defineTable({
		roomId: v.id("rooms"),
		characterId: v.id("characters"),
	}).index("roomId", ["roomId", "characterId"]),

	roomAssets: defineTable({
		roomId: v.id("rooms"),
		assetId: v.id("assets"),
		position: vector(),
		size: vector(),
		rotation: v.number(),
		locked: v.boolean(),
		inScene: v.boolean(),
		updateTime: v.number(),
	}).index("roomId", ["roomId", "assetId"]),

	messages: defineTable({
		sender: v.string(),
		content: v.string(),
		roomId: v.id("rooms"),
	}).index("roomId", ["roomId"]),
})
