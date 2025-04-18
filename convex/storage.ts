import { mutation } from "./_generated/server"

export const generateUploadUrl = mutation({
	args: {},
	async handler(ctx) {
		return await ctx.storage.generateUploadUrl()
	},
})
