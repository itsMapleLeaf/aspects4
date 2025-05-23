import { Anonymous } from "@convex-dev/auth/providers/Anonymous"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server"
import { DataModel } from "./_generated/dataModel"
import { query } from "./_generated/server"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
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
		Anonymous<DataModel>({
			profile(params) {
				if (typeof params.name !== "string") {
					throw new Error("Name is required")
				}
				return {
					name: params.name,
					isAnonymous: true,
				}
			},
		}),
	],
})

export const me = query({
	async handler(ctx) {
		const userId = await getAuthUserId(ctx)
		return userId && (await ctx.db.get(userId))
	},
})
