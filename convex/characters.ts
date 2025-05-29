import { getAuthUserId } from "@convex-dev/auth/server"
import { omit as omitValidator } from "convex-helpers"
import { partial } from "convex-helpers/validators"
import { v } from "convex/values"
import type { Merge, SetRequired } from "type-fest"
import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import schema from "./schema.ts"

export type NormalizedCharacter = Merge<
	SetRequired<Doc<"characters">, "name">,
	{
		data: Record<string, unknown>
		isOwner: boolean
	}
>

function normalizeCharacter(
	doc: Doc<"characters">,
	userId: Id<"users">,
): NormalizedCharacter {
	return { name: "", data: {}, ...doc, isOwner: doc.ownerId === userId }
}

export const get = query({
	args: { characterId: v.id("characters") },
	async handler(ctx, { characterId }) {
		return await ctx.db.get(characterId)
	},
})

export const listByRoom = query({
	args: { roomId: v.id("rooms") },
	async handler(ctx, { roomId }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		const characters = await ctx.db
			.query("characters")
			.withIndex("roomId", (q) => q.eq("roomId", roomId))
			.collect()

		return characters
			.filter((it) => it.isPublic || it.ownerId === userId)
			.map((it) => normalizeCharacter(it, userId))
			.sort((a, b) => a.name.localeCompare(b.name))
	},
})

export const listOwned = query({
	async handler(ctx) {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		const characters = await ctx.db
			.query("characters")
			.withIndex("ownerId", (q) => q.eq("ownerId", userId))
			.collect()

		return characters.map((it) => normalizeCharacter(it, userId))
	},
})

export const create = mutation({
	args: {
		...omitValidator(schema.tables.characters.validator.fields, ["ownerId"]),
		roomId: v.id("rooms"),
	},
	async handler(ctx, args) {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error("Not logged in")

		const data = { name: "New Character", ...args, ownerId: userId }

		const id = await ctx.db.insert("characters", data)

		return { ...data, _id: id, _creationTime: Date.now() }
	},
})

export const update = mutation({
	args: {
		characterId: v.id("characters"),
		data: v.object(partial(schema.tables.characters.validator.fields)),
	},
	async handler(ctx, { characterId, data }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error("Not logged in")

		const character = await ctx.db.get(characterId)
		if (!character) throw new Error("Character not found")

		const room = await ctx.db.get(
			// @ts-expect-error: will be fixed when roomId is required later
			character.roomId,
		)
		if (!room) throw new Error("Character room not found")

		const hasPermission = character.ownerId === userId || userId == room.ownerId
		if (!hasPermission) throw new Error("Not allowed")

		return await ctx.db.patch(characterId, {
			...data,
			data: { ...character.data, ...data.data },
		})
	},
})

export const remove = mutation({
	args: { characterId: v.id("characters") },
	async handler(ctx, { characterId }) {
		await ctx.db.delete(characterId)
	},
})

export const isInRoom = query({
	args: { characterId: v.id("characters"), roomId: v.id("rooms") },
	async handler(ctx, { characterId, roomId }) {
		const query = ctx.db
			.query("roomCharacters")
			.withIndex("roomId", (q) =>
				q.eq("roomId", roomId).eq("characterId", characterId),
			)

		for await (const _ of query) {
			return true
		}

		return false
	},
})

export const addToRoom = mutation({
	args: { characterId: v.id("characters"), roomId: v.id("rooms") },
	async handler(ctx, { characterId, roomId }) {
		await ctx.db.insert("roomCharacters", { characterId, roomId })
	},
})

export const removeFromRoom = mutation({
	args: { characterId: v.id("characters"), roomId: v.id("rooms") },
	async handler(ctx, { characterId, roomId }) {
		const query = ctx.db
			.query("roomCharacters")
			.withIndex("roomId", (q) =>
				q.eq("roomId", roomId).eq("characterId", characterId),
			)

		for await (const doc of query) {
			await ctx.db.delete(doc._id)
		}
	},
})
