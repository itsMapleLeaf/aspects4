import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

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
		return room
	},
})

export const create = mutation({
	args: {
		name: v.string(),
	},
	async handler(ctx, { name }) {
		const roomId = await ctx.db.insert("rooms", { name })
		return roomId
	},
})

export const update = mutation({
	args: {
		roomId: v.id("rooms"),
		name: v.string(),
	},
	async handler(ctx, { roomId, name }) {
		await ctx.db.patch(roomId, { name })
		return roomId
	},
})
