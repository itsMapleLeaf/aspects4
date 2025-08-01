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
	args: {},
	async handler(ctx) {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		return ctx.db
			.query("templates")
			.withIndex("ownerId", (q) => q.eq("ownerId", userId))
			.collect()
	},
})

export const get = query({
	args: {
		templateId: v.id("templates"),
	},
	async handler(ctx, { templateId }) {
		return await ctx.db.get(templateId)
	},
})

export const create = mutation({
	args: omit(schema.tables.templates.validator.fields, ["ownerId"]),
	async handler(ctx, args) {
		const userId = await ensureAuthUserId(ctx)
		const templateId = await ctx.db.insert("templates", {
			ownerId: userId,
			...args,
		})
		return templateId
	},
})

export const update = mutation({
	args: {
		id: v.id("templates"),
		data: v.object(
			partial(omit(schema.tables.templates.validator.fields, ["ownerId"])),
		),
	},
	async handler(ctx, { id, data }) {
		await ensureOwnedTemplate(ctx, id)
		await ctx.db.patch(id, data)
	},
})

export const remove = mutation({
	args: {
		id: v.id("templates"),
	},
	async handler(ctx, { id }) {
		await ensureOwnedTemplate(ctx, id)
		await ctx.db.delete(id)
	},
})

async function ensureOwnedTemplate(ctx: QueryCtx, id: Id<"templates">) {
	const userId = await ensureAuthUserId(ctx)

	const template =
		(await ctx.db.get(id)) ?? throwUserError("Template not found")

	if (template.ownerId !== userId) {
		throwUserError("Unauthorized")
	}
}
