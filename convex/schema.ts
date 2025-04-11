import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	messages: defineTable({
		sender: v.string(),
		content: v.string(),
		roomId: v.id("rooms"),
	}),
	rooms: defineTable({
		name: v.string(),
	}),
	assets: defineTable({
		name: v.string(),
		type: v.string(),
		fileId: v.id("_storage"),
		roomId: v.id("rooms"),
		position: v.object({
			x: v.number(),
			y: v.number(),
		}),
		size: v.optional(v.object({
			width: v.number(),
			height: v.number(),
		})),
		rotation: v.optional(v.number()),
		createdAt: v.number(),
	}),
})
