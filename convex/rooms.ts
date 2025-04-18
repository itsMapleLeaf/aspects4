import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"

export const list = query({
	args: {},
	async handler(ctx) {
		const rooms = await ctx.db.query("rooms").collect()
		return rooms
	},
})

export const get = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const room = await ctx.db.get(roomId)
		return room && toClientRoom(ctx, room)
	},
})

export const getBySlug = query({
	args: {
		slug: v.string(),
	},
	async handler(ctx, { slug }) {
		const room = await ctx.db
			.query("rooms")
			.withIndex("slug", (q) => q.eq("slug", slug))
			.first()
		return room && toClientRoom(ctx, room)
	},
})

export const create = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
	},
	async handler(ctx, { name, slug }) {
		const roomId = await ctx.db.insert("rooms", { name, slug })
		return roomId
	},
})

export const update = mutation({
	args: {
		roomId: v.id("rooms"),
		name: v.optional(v.string()),
		backgroundId: v.optional(v.union(v.id("_storage"), v.null())),
	},
	async handler(ctx, { roomId, ...args }) {
		const room = await ctx.db.get(roomId)
		if (
			args.backgroundId !== undefined &&
			room?.backgroundId &&
			room.backgroundId !== args.backgroundId
		) {
			try {
				await ctx.storage.delete(room.backgroundId)
			} catch (error) {
				console.error("Failed to delete room image", error, room)
			}
		}
		await ctx.db.patch(roomId, args)
		return roomId
	},
})

async function toClientRoom(ctx: QueryCtx, room: Doc<"rooms">) {
	const { backgroundId, ...clientRoom } = room
	return {
		...clientRoom,
		backgroundUrl: backgroundId && (await ctx.storage.getUrl(backgroundId)),
	}
}
