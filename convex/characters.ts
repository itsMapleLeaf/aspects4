import { partial } from "convex-helpers/validators"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import schema from "./schema.ts"

export const get = query({
	args: {
		key: v.string(),
		roomId: v.id("rooms"),
	},
	async handler(ctx, { key, roomId }) {
		return await ctx.db
			.query("characters")
			.withIndex("key", (q) => q.eq("key", key).eq("roomId", roomId))
			.unique()
	},
})

export const list = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		return await ctx.db
			.query("characters")
			.withIndex("roomId", (q) => q.eq("roomId", roomId))
			.collect()
	},
})

export const create = mutation({
	args: schema.tables.characters.validator.fields,
	async handler(ctx, args) {
		return await ctx.db.insert("characters", args)
	},
})

export const update = mutation({
	args: {
		characterId: v.id("characters"),
		data: v.object(partial(schema.tables.characters.validator.fields)),
	},
	async handler(ctx, { characterId, data }) {
		return await ctx.db.patch(characterId, data)
	},
})

export const remove = mutation({
	args: {
		characterId: v.id("characters"),
	},
	async handler(ctx, { characterId }) {
		await ctx.db.delete(characterId)
	},
})

export const migrateClientData = mutation({
	async handler(ctx) {
		for await (const {
			_id,
			_creationTime,
			roomId,
			key,
			clientData,
			...rest
		} of ctx.db.query("characters")) {
			if (!clientData) {
				await ctx.db.replace(_id, {
					roomId,
					key,
					clientData: { ...rest, key },
				})
			}
		}
	},
})
