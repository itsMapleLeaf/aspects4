import { getAuthUserId } from "@convex-dev/auth/server"
import { omit } from "convex-helpers"
import { partial } from "convex-helpers/validators"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import schema from "./schema.ts"

export type NormalizedCharacter = ReturnType<typeof normalizeCharacter>

function normalizeCharacter({ clientData, ...rest }: Doc<"characters">) {
	return {
		name: "",
		data: {},
		bonds: [],
		items: [],
		...rest,
	}
}

export const migrateClientData = mutation({
	async handler(ctx) {
		for await (const character of ctx.db.query("characters")) {
			if (character.clientData) {
				await ctx.db.patch(character._id, {
					...(character.clientData as any),
					clientData: undefined,
					key: undefined,
					roomId: undefined,
				})
			}
		}
	},
})

export const get = query({
	args: {
		characterId: v.id("characters"),
	},
	async handler(ctx, { characterId }) {
		return await ctx.db.get(characterId)
	},
})

export const listByRoom = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const roomCharacters = await ctx.db
			.query("roomCharacters")
			.withIndex("roomId", (q) => q.eq("roomId", roomId))
			.collect()

		const characters = await Array.fromAsync(roomCharacters, (entry) =>
			ctx.db.get(entry.characterId),
		)

		return characters
			.filter(Boolean)
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
	args: omit(schema.tables.characters.validator.fields, [
		"ownerId",
		"roomId",
		"key",
		"clientData",
	]),
	async handler(ctx, args) {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error("Not logged in")

		const data = {
			...args,
			ownerId: userId,
		}

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
	args: {
		characterId: v.id("characters"),
	},
	async handler(ctx, { characterId }) {
		await ctx.db.delete(characterId)
	},
})

export const isInRoom = query({
	args: {
		characterId: v.id("characters"),
		roomId: v.id("rooms"),
	},
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
	args: {
		characterId: v.id("characters"),
		roomId: v.id("rooms"),
	},
	async handler(ctx, { characterId, roomId }) {
		await ctx.db.insert("roomCharacters", { characterId, roomId })
	},
})

export const removeFromRoom = mutation({
	args: {
		characterId: v.id("characters"),
		roomId: v.id("rooms"),
	},
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
