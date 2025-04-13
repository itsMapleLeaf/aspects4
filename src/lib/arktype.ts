import { type } from "arktype"

export type FallbackArg<T> = T | ((input: unknown) => T)

export const fallbackType = <T>(fallback: FallbackArg<T>) =>
	type("unknown").pipe((input) =>
		fallback instanceof Function ? fallback(input) : fallback,
	)

export const fallbackStringType = (fallbackArg: FallbackArg<string> = "") =>
	fallbackType((input) =>
		typeof input === "string" ? input
		: fallbackArg instanceof Function ? fallbackArg(input)
		: String(fallbackArg),
	)
