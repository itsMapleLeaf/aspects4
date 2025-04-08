import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
	args: {},
	async handler(ctx) {
		const messages = await ctx.db.query("messages").order("desc").take(20)
		return messages.toReversed()
	},
})

export const create = mutation({
	args: {
		sender: v.string(),
		content: v.string(),
	},
	async handler(ctx, { sender, content }) {
		await ctx.db.insert("messages", { sender, content })
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
