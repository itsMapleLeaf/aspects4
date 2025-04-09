import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		let messagesQuery = ctx.db.query("messages")

		if (roomId) {
			messagesQuery = messagesQuery.filter((q) =>
				q.eq(q.field("roomId"), roomId),
			)
		}

		const messages = await messagesQuery.order("desc").take(20)
		return messages.toReversed()
	},
})

export const create = mutation({
	args: {
		sender: v.string(),
		content: v.string(),
		roomId: v.id("rooms"),
	},
	async handler(ctx, { sender, content, roomId }) {
		await ctx.db.insert("messages", { sender, content, roomId })
	},
})

export const remove = mutation({
	args: {
		messageId: v.id("messages"),
	},
	async handler(ctx, args) {
		await ctx.db.delete(args.messageId)
	},
})
