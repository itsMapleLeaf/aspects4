import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"

async function ensureRoomOwner(ctx: QueryCtx, roomId: Id<"rooms">) {
	const userId = await getAuthUserId(ctx)
	if (!userId) {
		throw new Error("Not signed in")
	}

	const room = await ctx.db.get(roomId)
	if (!room || room._id !== roomId) {
		throw new Error("Room not found")
	}

	if (room.ownerId !== userId) {
		throw new Error("Only the room owner can manage scenes")
	}

	return userId
}

export type NormalizedScene = Awaited<ReturnType<typeof normalizeScene>>
async function normalizeScene(ctx: QueryCtx, doc: Doc<"scenes">) {
	const spriteCount = await ctx.db
		.query("sprites")
		.withIndex("sceneId", (q) => q.eq("sceneId", doc._id))
		.collect()
		.then((sprites) => sprites.length)

	return {
		...doc,
		spriteCount,
	}
}

export const list = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("roomId", (q) => q.eq("roomId", roomId))
			.collect()

		const normalized = await Array.fromAsync(scenes, (scene) =>
			normalizeScene(ctx, scene),
		)

		return normalized.sort((a, b) => a.createdAt - b.createdAt)
	},
})

export const create = mutation({
	args: {
		roomId: v.id("rooms"),
		name: v.string(),
	},
	async handler(ctx, { roomId, name }) {
		await ensureRoomOwner(ctx, roomId)

		const now = Date.now()
		const sceneId = await ctx.db.insert("scenes", {
			name,
			roomId,
			createdAt: now,
			updatedAt: now,
		})

		return await ctx.db.get(sceneId)
	},
})

export const update = mutation({
	args: {
		sceneId: v.id("scenes"),
		name: v.optional(v.string()),
	},
	async handler(ctx, { sceneId, name }) {
		const scene = await ctx.db.get(sceneId)
		if (!scene) {
			throw new Error("Scene not found")
		}

		await ensureRoomOwner(ctx, scene.roomId)

		const updateData: Partial<Doc<"scenes">> = {
			updatedAt: Date.now(),
		}

		if (name !== undefined) {
			updateData.name = name
		}

		await ctx.db.patch(sceneId, updateData)
		return await ctx.db.get(sceneId)
	},
})

export const remove = mutation({
	args: {
		sceneId: v.id("scenes"),
	},
	async handler(ctx, { sceneId }) {
		const scene = await ctx.db.get(sceneId)
		if (!scene) {
			throw new Error("Scene not found")
		}

		await ensureRoomOwner(ctx, scene.roomId)

		// Unassign all sprites from this scene (don't delete them)
		const sprites = await ctx.db
			.query("sprites")
			.withIndex("sceneId", (q) => q.eq("sceneId", sceneId))
			.collect()

		for (const sprite of sprites) {
			await ctx.db.patch(sprite._id, {
				sceneId: undefined,
				updateTime: Date.now(),
			})
		}

		// Remove the scene
		await ctx.db.delete(sceneId)
	},
})

export const activate = mutation({
	args: {
		sceneId: v.id("scenes"),
	},
	async handler(ctx, { sceneId }) {
		const scene = await ctx.db.get(sceneId)
		if (!scene) {
			throw new Error("Scene not found")
		}

		await ensureRoomOwner(ctx, scene.roomId)

		// Set this scene as the active scene for the room
		await ctx.db.patch(scene.roomId, { activeSceneId: sceneId })

		return await ctx.db.get(sceneId)
	},
})

export const deactivate = mutation({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		await ensureRoomOwner(ctx, roomId)

		// Clear the active scene for the room
		await ctx.db.patch(roomId, { activeSceneId: undefined })
	},
})

export const getActive = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const room = await ctx.db.get(roomId)
		if (!room?.activeSceneId) {
			return null
		}

		const activeScene = await ctx.db.get(room.activeSceneId)
		return activeScene ? await normalizeScene(ctx, activeScene) : null
	},
})
