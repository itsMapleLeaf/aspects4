import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { raise } from "../src/lib/utils.ts"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { getRoomMembers } from "./rooms"

export const list = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, { roomId }) {
		let messagesQuery = ctx.db.query("messages")

		if (roomId) {
			messagesQuery = messagesQuery.filter((q) =>
				q.eq(q.field("roomId"), roomId),
			)
		}

		const messages = await messagesQuery.order("desc").take(20)
		return messages.toReversed()
	},
})

export const create = mutation({
	args: {
		content: v.string(),
		roomId: v.id("rooms"),
	},
	async handler(ctx, { content, roomId }) {
		const user = await ensureAuthUser(ctx)

		const room =
			(await ctx.db.get(roomId)) ??
			raise(new ConvexError({ message: "Room not found", roomId }))

		if (!getRoomMembers(room).includes(user._id)) {
			throw new ConvexError({
				message: "Unauthorized",
				user,
				roomId,
			})
		}

		if (!user.name) {
			console.warn("Sending message with unnamed user", {
				user,
				content,
				roomId,
			})
		}

		await ctx.db.insert("messages", {
			sender: user.name ?? "Unnamed Player",
			content,
			roomId,
		})
	},
})

export const remove = mutation({
	args: {
		messageId: v.id("messages"),
	},
	async handler(ctx, args) {
		await ctx.db.delete(args.messageId)
	},
})

async function ensureAuthUserId(ctx: MutationCtx) {
	return (await getAuthUserId(ctx)) ?? raise("Not signed in")
}

async function ensureAuthUser(ctx: MutationCtx) {
	const userId = await ensureAuthUserId(ctx)

	const user =
		(await ctx.db.get(userId)) ??
		raise(new ConvexError({ message: "FATAL: user doc not found", userId }))

	return user
}
