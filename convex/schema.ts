import { authTables } from "@convex-dev/auth/server"
import { deprecated, literals } from "convex-helpers/validators"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { optionull, vector } from "./lib/validators.ts"

export default defineSchema({
	...authTables,

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
		activeSceneId: v.optional(v.id("scenes")),
	})
		.index("name", ["name"])
		.index("slug", ["slug"])
		.index("ownerId", ["ownerId"]),

	scenes: defineTable({
		name: v.string(),
		roomId: v.id("rooms"),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("roomId", ["roomId", "createdAt"]),

	sprites: defineTable({
		roomId: v.id("rooms"),
		sceneId: v.optional(v.id("scenes")),
		assetId: v.id("assets"),
		position: vector(),
		size: vector(),
		rotation: v.number(),
		locked: v.boolean(),
		inScene: deprecated,
		updateTime: v.number(),
	})
		.index("roomId", ["roomId", "assetId"])
		.index("sceneId", ["sceneId", "assetId"]),

	messages: defineTable({
		sender: v.string(),
		content: v.string(),
		roomId: v.id("rooms"),
	}).index("roomId", ["roomId"]),

	templates: defineTable({
		name: v.string(),
		ownerId: v.id("users"),
		blocks: v.optional(
			v.array(
				v.object({
					key: v.string(),
					type: v.string(),
					data: v.optional(v.record(v.string(), v.any())),
				}),
			),
		),
	})
		.index("ownerId", ["ownerId", "name"])
		.searchIndex("name", { searchField: "name" }),

	sheets: defineTable({
		name: v.optional(v.string()),
		data: v.optional(v.record(v.string(), v.any())),
		templateId: v.id("templates"),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
		visibility: literals("public", "private"),
	})
		.index("ownerId_roomId", ["ownerId", "roomId", "name"])
		.searchIndex("name", { searchField: "name" }),
})
