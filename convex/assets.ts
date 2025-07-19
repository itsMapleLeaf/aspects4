import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { vector } from "./lib/validators.ts"

export type NormalizedAsset = Awaited<ReturnType<typeof normalizeAsset>>
export async function normalizeAsset(ctx: QueryCtx, asset: Doc<"assets">) {
	const { storageId, ...doc } = asset
	return {
		...doc,
		url: await ctx.storage.getUrl(storageId),
	}
}

export const list = query({
	async handler(ctx) {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		const ownedAssets = await ctx.db
			.query("assets")
			.withIndex("ownerId", (q) => q.eq("ownerId", userId))
			.collect()

		return await Array.fromAsync(ownedAssets, (asset) =>
			normalizeAsset(ctx, asset),
		)
	},
})

export const create = mutation({
	args: {
		name: v.string(),
		type: v.string(),
		size: vector(),
		storageId: v.id("_storage"),
	},
	async handler(ctx, args) {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error("Not logged in")
		return await ctx.db.insert("assets", { ...args, ownerId: userId })
	},
})

export const update = mutation({
	args: {
		assetId: v.id("assets"),
		name: v.string(),
	},
	async handler(ctx, { assetId, ...updates }) {
		await ctx.db.patch(assetId, {
			...updates,
		})
	},
})

export const remove = mutation({
	args: {
		assetIds: v.array(v.id("assets")),
	},
	async handler(ctx, { assetIds }) {
		for (const assetId of assetIds) {
			const asset = await ctx.db.get(assetId)
			if (!asset) throw new Error("Asset not found")
			await ctx.storage.delete(asset.storageId)
			await ctx.db.delete(assetId)
		}
	},
})
