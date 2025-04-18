import { Anonymous } from "@convex-dev/auth/providers/Anonymous"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [Password, Anonymous],
})
