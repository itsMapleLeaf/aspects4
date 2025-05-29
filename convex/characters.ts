import { getAuthUserId } from "@convex-dev/auth/server"
import { omit as omitValidator } from "convex-helpers"
import { partial } from "convex-helpers/validators"
import { v } from "convex/values"
import { omit } from "es-toolkit"
import type { OverrideProperties, SetRequired } from "type-fest"
import type { Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import schema from "./schema.ts"

export const migrate = mutation({
	async handler(ctx) {
		for await (const roomCharacter of ctx.db.query("roomCharacters")) {
			const character = (await ctx.db.get(roomCharacter.characterId))!
			await ctx.db.insert("characters", {
				...omit(character, ["_id", "_creationTime"]),
				roomId: roomCharacter.roomId,
				data: {
					...character.data,
					items: character.items,
					bonds: character.bonds,
				},
				items: undefined,
				bonds: undefined,
			})
		}
	},
})

export type NormalizedCharacter = OverrideProperties<
	SetRequired<Doc<"characters">, "name">,
	{
		data: Record<string, unknown>
	}
>

function normalizeCharacter(doc: Doc<"characters">): NormalizedCharacter {
	return { name: "", data: {}, ...doc }
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
			.map(normalizeCharacter)
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

		return characters.map(normalizeCharacter)
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
		return await ctx.db.patch(characterId, data)
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
