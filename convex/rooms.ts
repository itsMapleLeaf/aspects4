import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { pick } from "es-toolkit"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"

export type ClientRoom = Awaited<ReturnType<typeof toClientRoom>>
async function toClientRoom(ctx: QueryCtx, room: Doc<"rooms">) {
	const backgroundUrl =
		room.backgroundId && (await ctx.storage.getUrl(room.backgroundId))

	const userId = await getAuthUserId(ctx)

	let members = room.memberUserIds ?? []
	if (room.ownerId) {
		members.push(room.ownerId)
	}

	return {
		...pick(room, ["_id", "_creationTime", "name", "slug"]),
		backgroundUrl,
		isMember: userId != null && members.includes(userId),
	}
}

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
		backgroundId: v.optional(v.union(v.id("_storage"), v.null())),
	},
	async handler(ctx, { roomId, ...args }) {
		const room = await ctx.db.get(roomId)
		if (
			args.backgroundId !== undefined &&
			room?.backgroundId &&
			room.backgroundId !== args.backgroundId
		) {
			try {
				await ctx.storage.delete(room.backgroundId)
			} catch (error) {
				console.error("Failed to delete room image", error, room)
			}
		}
		await ctx.db.patch(roomId, args)
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
