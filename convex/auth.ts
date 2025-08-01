import Discord from "@auth/core/providers/discord"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import { query, type QueryCtx } from "./_generated/server"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Discord({
			profile(profile, _tokens) {
				return {
					id: profile.id,
					name: profile.global_name ?? profile.username,
					email: profile.email,
					image:
						profile.avatar ?
							`https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
						:	null,
				}
			},
		}),
		Password({
			profile(params) {
				if (typeof params.email !== "string") {
					throw new Error("Email is required")
				}

				if (params.flow === "signUp") {
					if (typeof params.name !== "string") {
						throw new Error("Name is required")
					}
					return {
						name: params.name,
						email: params.email,
					}
				}

				if (params.flow === "signIn") {
					return {
						// typescript made me do this
						...(typeof params.name === "string" && { name: params.name }),
						email: params.email,
					}
				}

				throw new Error(`Unknown auth flow "${params.flow}"`)
			},
		}),
	],
	callbacks: {
		async createOrUpdateUser(ctx, args) {
			// Check if user already exists by email
			const existingUser = await ctx.db
				.query("users")
				.filter((q) => q.eq(q.field("email"), args.profile.email))
				.first()

			if (existingUser) {
				// User exists, only update if name/image are not set or if this is a Discord sign-in
				const updates: Partial<{ name: string; image: string }> = {}

				// Only update name and image from Discord if they're not already set
				if (args.provider.id === "discord") {
					if (
						!existingUser.name &&
						args.profile.name &&
						typeof args.profile.name === "string"
					) {
						updates.name = args.profile.name
					}
					if (
						!existingUser.image &&
						args.profile.image &&
						typeof args.profile.image === "string"
					) {
						updates.image = args.profile.image
					}
				}

				if (Object.keys(updates).length > 0) {
					await ctx.db.patch(existingUser._id, updates)
				}

				return existingUser._id
			}

			// Create new user with all profile data
			return await ctx.db.insert("users", {
				...args.profile,
			})
		},
	},
})

export const me = query({
	async handler(ctx) {
		const userId = await getAuthUserId(ctx)
		return userId && (await ctx.db.get(userId))
	},
})

export async function ensureAuthUserId(ctx: QueryCtx) {
	const userId = await getAuthUserId(ctx)
	if (!userId) throw new ConvexError({ userMessage: "Not signed in" })
	return userId
}
