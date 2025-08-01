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
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		return ctx.db
			.query("sheets")
			.withIndex("ownerId_roomId", (q) =>
				q.eq("ownerId", userId).eq("roomId", roomId),
			)
			.collect()
	},
})

export const get = query({
	args: {
		sheetId: v.id("sheets"),
	},
	async handler(ctx, { sheetId }) {
		return await ctx.db.get(sheetId)
	},
})

export const create = mutation({
	args: omit(schema.tables.sheets.validator.fields, ["ownerId"]),
	async handler(ctx, args) {
		const userId = await ensureAuthUserId(ctx)
		const sheetId = await ctx.db.insert("sheets", {
			ownerId: userId,
			...args,
		})
		return sheetId
	},
})

export const update = mutation({
	args: {
		id: v.id("sheets"),
		data: v.object(
			partial(omit(schema.tables.sheets.validator.fields, ["ownerId"])),
		),
	},
	async handler(ctx, { id, data }) {
		await ensureOwnedSheet(ctx, id)
		await ctx.db.patch(id, data)
	},
})

export const remove = mutation({
	args: {
		id: v.id("sheets"),
	},
	async handler(ctx, { id }) {
		await ensureOwnedSheet(ctx, id)
		await ctx.db.delete(id)
	},
})

async function ensureOwnedSheet(ctx: QueryCtx, id: Id<"sheets">) {
	const userId = await ensureAuthUserId(ctx)
	const sheet = (await ctx.db.get(id)) ?? throwUserError("Sheet not found")
	if (sheet.ownerId !== userId) {
		throwUserError("Unauthorized")
	}
}
