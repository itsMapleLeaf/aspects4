import { v } from "convex/values"
import { internalQuery, mutation } from "./_generated/server"

export const generateUploadUrl = mutation({
	args: {},
	async handler(ctx) {
		return await ctx.storage.generateUploadUrl()
	},
})

export const getMetadata = internalQuery({
	args: { storageId: v.id("_storage") },
	async handler(ctx, args) {
		return await ctx.db.system.get(args.storageId)
	},
})
