import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const assets = await ctx.db
			.query("assets")
			.filter((q) => q.eq(q.field("roomId"), roomId))
			.order("desc")
			.collect()

		const assetsWithUrl = await Array.fromAsync(assets, async (asset) => ({
			...asset,
			url: await ctx.storage.getUrl(asset.fileId),
		}))

		return assetsWithUrl.sort((a, b) => a.updatedAt - b.updatedAt)
	},
})

export const get = query({
	args: {
		assetId: v.id("assets"),
	},
	async handler(ctx, { assetId }) {
		const asset = await ctx.db.get(assetId)
		if (!asset) return null

		const url = await ctx.storage.getUrl(asset.fileId)
		return { ...asset, url }
	},
})

export const create = mutation({
	args: {
		name: v.string(),
		type: v.string(),
		fileId: v.id("_storage"),
		roomId: v.id("rooms"),
		position: v.object({
			x: v.number(),
			y: v.number(),
		}),
		size: v.optional(
			v.object({
				width: v.number(),
				height: v.number(),
			}),
		),
		rotation: v.optional(v.number()),
	},
	async handler(ctx, args) {
		const assetId = await ctx.db.insert("assets", {
			...args,
			updatedAt: Date.now(),
		})
		return assetId
	},
})

export const update = mutation({
	args: {
		assetId: v.id("assets"),
		position: v.optional(
			v.object({
				x: v.number(),
				y: v.number(),
			}),
		),
		size: v.optional(
			v.object({
				width: v.number(),
				height: v.number(),
			}),
		),
		rotation: v.optional(v.number()),
		locked: v.optional(v.boolean()),
	},
	async handler(ctx, { assetId, ...updates }) {
		await ctx.db.patch(assetId, {
			...updates,
		})
	},
})

export const remove = mutation({
	args: {
		assetId: v.id("assets"),
	},
	async handler(ctx, { assetId }) {
		const asset = await ctx.db.get(assetId)
		if (!asset) throw new Error("Asset not found")

		await ctx.storage.delete(asset.fileId)

		await ctx.db.delete(assetId)
		return assetId
	},
})

export const moveToFront = mutation({
	args: {
		assetId: v.id("assets"),
	},
	async handler(ctx, { assetId }) {
		const asset = await ctx.db.get(assetId)
		if (!asset) throw new Error("Asset not found")

		await ctx.db.patch(assetId, {
			updatedAt: Date.now(),
		})
	},
})
