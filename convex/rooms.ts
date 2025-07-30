import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { pick } from "es-toolkit"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"

export const list = query({
	args: {},
	async handler(ctx) {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return []
		}

		// room member users are an array property on docs, and we can't query for those
		// TODO: optimize this with a membership join table eventually
		const rooms = []
		for await (const room of ctx.db.query("rooms").order("desc")) {
			if (room.ownerId === userId || room.memberUserIds?.includes(userId)) {
				rooms.push(room)
			}
		}
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
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Not signed in")
		}

		const roomId = await ctx.db.insert("rooms", {
			name,
			slug,
			ownerId: userId,
		})
		return roomId
	},
})

export const update = mutation({
	args: {
		roomId: v.id("rooms"),
		name: v.optional(v.string()),
		backgroundAssetId: v.optional(v.union(v.id("assets"), v.null())),
	},
	async handler(ctx, { roomId, ...args }) {
		const room = await ctx.db.get(roomId)

		if (room?.backgroundId) {
			try {
				await ctx.storage.delete(room.backgroundId)
			} catch (error) {
				console.error("Failed to delete room image", error, room)
			}
		}

		await ctx.db.patch(roomId, {
			...args,
			backgroundAssetId: args.backgroundAssetId,
			backgroundId: undefined,
		})

		return roomId
	},
})

export const join = mutation({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Not signed in")
		}

		const room = await ctx.db.get(roomId)
		if (!room) {
			throw new Error("Room not found")
		}

		// If user is already the owner, no need to add to members
		if (room.ownerId === userId) {
			return roomId
		}

		// Add user to memberUserIds if not already a member
		const memberUserIds = room.memberUserIds || []
		if (!memberUserIds.includes(userId)) {
			await ctx.db.patch(roomId, {
				memberUserIds: [...memberUserIds, userId],
			})
		}

		return roomId
	},
})

export const leave = mutation({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Not signed in")
		}

		const room = await ctx.db.get(roomId)
		if (!room) {
			throw new Error("Room not found")
		}

		// Owners cannot leave their own room
		if (room.ownerId === userId) {
			throw new Error("Room owners cannot leave their own room")
		}

		// Remove user from memberUserIds if they are a member
		const memberUserIds = room.memberUserIds || []
		if (memberUserIds.includes(userId)) {
			await ctx.db.patch(roomId, {
				memberUserIds: memberUserIds.filter((id) => id !== userId),
			})
		}

		return roomId
	},
})

export type ClientRoom = Awaited<ReturnType<typeof toClientRoom>>
async function toClientRoom(ctx: QueryCtx, room: Doc<"rooms">) {
	let backgroundUrl: string | null = null

	if (room.backgroundAssetId) {
		const backgroundAsset = await ctx.db.get(room.backgroundAssetId)
		if (backgroundAsset) {
			backgroundUrl = await ctx.storage.getUrl(backgroundAsset.storageId)
		}
	} else if (room.backgroundId) {
		backgroundUrl = await ctx.storage.getUrl(room.backgroundId)
	}

	const userId = await getAuthUserId(ctx)

	const members = getRoomMembers(room)

	return {
		...pick(room, ["_id", "_creationTime", "name", "slug", "activeSceneId"]),
		backgroundUrl,
		backgroundAssetId: room.backgroundAssetId || null,
		isMember: userId != null && members.includes(userId),
		isOwner: userId === room.ownerId,
	}
}

export function getRoomMembers(room: Doc<"rooms">) {
	const members = room.memberUserIds ?? []
	if (room.ownerId) {
		members.push(room.ownerId)
	}
	return members
}
