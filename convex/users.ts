import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation } from "./_generated/server"

export const updateProfile = mutation({
	args: {
		name: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	async handler(ctx, updates) {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Not signed in")
		}

		// Filter out undefined values
		const filteredUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined),
		)

		if (Object.keys(filteredUpdates).length === 0) {
			const user = await ctx.db.get(userId)
			return user
		}

		await ctx.db.patch(userId, filteredUpdates)
		const updatedUser = await ctx.db.get(userId)
		return updatedUser
	},
})

export const updateAvatar = mutation({
	args: {
		storageId: v.union(v.id("_storage"), v.null()),
	},
	async handler(ctx, { storageId }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Not signed in")
		}

		let imageUrl: string | null = null
		if (storageId) {
			imageUrl = await ctx.storage.getUrl(storageId)
		}

		await ctx.db.patch(userId, { image: imageUrl ?? undefined })
		const updatedUser = await ctx.db.get(userId)
		return updatedUser
	},
})
