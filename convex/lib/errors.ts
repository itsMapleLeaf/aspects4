import { ConvexError } from "convex/values"

export function throwUserError(userMessage: string): never {
	throw new ConvexError({
		userMessage: userMessage,
	})
}
