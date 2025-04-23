import { getAuthUserId } from "@convex-dev/auth/server"
import { partial } from "convex-helpers/validators"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { normalizeAsset } from "./assets.ts"
import schema from "./schema.ts"

export type NormalizedRoomAsset = Awaited<ReturnType<typeof normalizeRoomAsset>>
async function normalizeRoomAsset(ctx: QueryCtx, doc: Doc<"roomAssets">) {
	const assetDoc = await ctx.db.get(doc.assetId)
	const { name, url } =
		(assetDoc && (await normalizeAsset(ctx, assetDoc))) || {}
	return {
		...doc,
		name,
		url,
	}
}

export const list = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const assets = await ctx.db
			.query("roomAssets")
			.withIndex("roomId", (q) => q.eq("roomId", roomId))
			.collect()
		return await Array.fromAsync(assets, (asset) =>
			normalizeRoomAsset(ctx, asset),
		)
	},
})

export const create = mutation({
	args: {
		...partial(schema.tables.roomAssets.validator.fields),
		roomId: v.id("rooms"),
		assetId: v.id("assets"),
	},
	async handler(ctx, { roomId, assetId, ...args }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Not signed in")
		}

		const assetDoc = await ctx.db.get(assetId)
		if (!assetDoc) {
			throw new Error("Asset not found")
		}

		await ctx.db.insert("roomAssets", {
			position: { x: 0, y: 0 },
			size: assetDoc.size,
			rotation: 0,
			locked: false,
			inScene: true,
			updateTime: Date.now(),
			...args,
			roomId,
			assetId,
		})
	},
})

export const update = mutation({
	args: {
		roomAssetId: v.id("roomAssets"),
		data: v.object(partial(schema.tables.roomAssets.validator.fields)),
	},
	async handler(ctx, { roomAssetId, data }) {
		await ctx.db.patch(roomAssetId, data)
	},
})

export const moveToFront = mutation({
	args: {
		roomAssetId: v.id("roomAssets"),
	},
	async handler(ctx, { roomAssetId }) {
		await ctx.db.patch(roomAssetId, { updateTime: Date.now() })
	},
})

export const remove = mutation({
	args: {
		roomAssetId: v.id("roomAssets"),
	},
	async handler(ctx, { roomAssetId }) {
		await ctx.db.delete(roomAssetId)
	},
})
