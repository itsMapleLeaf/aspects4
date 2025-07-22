import { getAuthUserId } from "@convex-dev/auth/server"
import { partial } from "convex-helpers/validators"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { normalizeAsset } from "./assets.ts"
import schema from "./schema.ts"

export type NormalizedSprite = Awaited<ReturnType<typeof normalizeSprite>>
async function normalizeSprite(ctx: QueryCtx, doc: Doc<"sprites">) {
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
			.query("sprites")
			.withIndex("roomId", (q) => q.eq("roomId", roomId))
			.collect()

		const normalized = await Array.fromAsync(assets, (asset) =>
			normalizeSprite(ctx, asset),
		)

		return normalized
			.sort((a, b) =>
				(a.name ?? "")
					.toLowerCase()
					.localeCompare((b.name ?? "").toLowerCase()),
			)
			.filter((asset) => asset.inScene)
	},
})

export const place = mutation({
	args: {
		...partial(schema.tables.sprites.validator.fields),
		roomId: v.id("rooms"),
		assetId: v.id("assets"),
	},
	async handler(ctx, { roomId, assetId, position = { x: 0, y: 0 }, ...args }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Not signed in")
		}

		const existing = await ctx.db
			.query("sprites")
			.withIndex("roomId", (q) => q.eq("roomId", roomId).eq("assetId", assetId))
			.first()

		if (existing) {
			await ctx.db.patch(existing._id, {
				...args,
				inScene: true,
				position: {
					x: position.x - existing.size.x / 2,
					y: position.y - existing.size.y / 2,
				},
				updateTime: Date.now(),
			})
			return
		}

		const assetDoc = await ctx.db.get(assetId)
		if (!assetDoc) {
			throw new Error("Asset not found")
		}

		const defaultSize = {
			x: 200,
			y: 200,
		}

		await ctx.db.insert("sprites", {
			size: defaultSize,
			rotation: 0,
			locked: false,
			updateTime: Date.now(),
			...args,
			position: {
				x: position.x - defaultSize.x / 2,
				y: position.y - defaultSize.y / 2,
			},
			inScene: true,
			roomId,
			assetId,
		})
	},
})

export const update = mutation({
	args: {
		spriteId: v.id("sprites"),
		data: v.object(partial(schema.tables.sprites.validator.fields)),
	},
	async handler(ctx, { spriteId, data }) {
		await ctx.db.patch(spriteId, data)
	},
})

export const moveToFront = mutation({
	args: {
		spriteId: v.id("sprites"),
	},
	async handler(ctx, { spriteId }) {
		await ctx.db.patch(spriteId, { updateTime: Date.now() })
	},
})

export const remove = mutation({
	args: {
		spriteId: v.id("sprites"),
	},
	async handler(ctx, { spriteId }) {
		await ctx.db.patch(spriteId, { inScene: false })
	},
})
