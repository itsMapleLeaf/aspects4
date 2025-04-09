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
})
