import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// List all assets in a room
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

		return await Array.fromAsync(assets, async (asset) => ({
			...asset,
			url: await ctx.storage.getUrl(asset.fileId),
		}))
	},
})

// Get a single asset by ID
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

// Generate a URL for uploading a file to Convex storage
export const generateUploadUrl = mutation({
	args: {},
	async handler(ctx) {
		return await ctx.storage.generateUploadUrl()
	},
})

// Create a new asset in the scene after file upload
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
			createdAt: Date.now(),
		})
		return assetId
	},
})

// Update an asset's position, size, or rotation
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
	},
	async handler(ctx, { assetId, ...updates }) {
		await ctx.db.patch(assetId, updates)
	},
})

// Delete an asset and its associated file
export const remove = mutation({
	args: {
		assetId: v.id("assets"),
	},
	async handler(ctx, { assetId }) {
		const asset = await ctx.db.get(assetId)
		if (!asset) throw new Error("Asset not found")

		// Delete the file from storage
		await ctx.storage.delete(asset.fileId)

		// Delete the asset record
		await ctx.db.delete(assetId)
		return assetId
	},
})
