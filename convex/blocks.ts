import { getAuthUserId } from "@convex-dev/auth/server"
import { omit } from "convex-helpers"
import { partial } from "convex-helpers/validators"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { ensureAuthUserId } from "./auth.ts"
import { throwUserError } from "./lib/errors.ts"
import schema from "./schema.ts"

export const list = query({
	args: {
		sceneId: v.id("scenes"),
	},
	async handler(ctx, { sceneId }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		return ctx.db
			.query("blocks")
			.withIndex("sceneId", (q) => q.eq("sceneId", sceneId))
			.collect()
	},
})

export const get = query({
	args: {
		id: v.id("blocks"),
	},
	async handler(ctx, { id }) {
		return await ctx.db.get(id)
	},
})

export const create = mutation({
	args: omit(schema.tables.blocks.validator.fields, ["ownerId"]),
	async handler(ctx, args) {
		const userId = await ensureAuthUserId(ctx)
		const blockId = await ctx.db.insert("blocks", {
			ownerId: userId,
			...args,
		})
		return blockId
	},
})

export const update = mutation({
	args: {
		id: v.id("blocks"),
		data: v.object(
			partial(omit(schema.tables.blocks.validator.fields, ["ownerId"])),
		),
	},
	async handler(ctx, { id, data }) {
		await ensureOwnedBlock(ctx, id)
		await ctx.db.patch(id, data)
	},
})

export const remove = mutation({
	args: {
		id: v.id("blocks"),
	},
	async handler(ctx, { id }) {
		await ensureOwnedBlock(ctx, id)
		await ctx.db.delete(id)
	},
})

async function ensureOwnedBlock(ctx: QueryCtx, id: Id<"blocks">) {
	const userId = await ensureAuthUserId(ctx)
	const block = (await ctx.db.get(id)) ?? throwUserError("Block not found")
	if (block.ownerId !== userId) {
		throwUserError("Unauthorized")
	}
}
