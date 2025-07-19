import type { Falsy } from "./types.ts"

export function withoutIndex<T>(array: T[], index: number) {
	const result = [...array]
	result.splice(index, 1)
	return result
}

/**
 * Toggles an item in an array - removes it if present, adds it if not
 *
 * @param array The original array
 * @param item The item to toggle
 * @returns A new array with the item toggled
 */
export function toggleInArray<T>(array: T[], item: T): T[] {
	const set = new Set(array || [])
	if (set.has(item)) {
		set.delete(item)
	} else {
		set.add(item)
	}
	return [...set]
}

/**
 * Filters out falsy values from an array and joins the truthy ones with a
 * separator
 *
 * @param separator String to join the values with (defaults to a space)
 * @param values Array of values (can contain falsy values)
 * @returns A string of joined truthy values
 */
export function compactJoin(
	separator: string,
	values: (string | Falsy)[],
): string {
	return values.filter(Boolean).join(separator)
}

export function parseNumberSafe(input: unknown) {
	const value = Number(input)
	return Number.isNaN(value) ? undefined : value
}

export function toTitleCase(fieldId: string) {
	return [...fieldId.matchAll(/[A-Z]?[a-z]+/g)]
		.map(
			([word]) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join(" ")
}

export function lowerFirst(text: string) {
	return text.slice(0, 1).toLowerCase() + text.slice(1)
}

/**
 * No-op helper to explicitly specify a type in an expression position to aid
 * inference. Compared to alternatives:
 *
 * - `satisfies` - Only ensures that an expression matches a type, and doesn't
 *   change the inferred type
 * - `as const` - Aggressively narrows the type and doesn't let you specify the
 *   actual type you want
 *
 * @example
 * 	type PlayerKind = "human" | "npc"
 *
 * 	const player = {
 * 		kind: typed<PlayerKind>("human"),
 * 	}
 *
 * 	type Player = typeof player
 *
 * 	const robot: Player = {
 * 		kind: "npc",
 * 	}
 */
export function typed<T>(value: T): T {
	return value
}

export function raise(error: string | object): never {
	throw typeof error === "string" ? new Error(error) : error
}

export function recordValues<const V>(object: Record<PropertyKey, V>) {
	return Object.values(object) as V[]
}

// the URL constructor and URLSearchParams encode param values which sometimes breaks things
export function urlSearchParams(params: Record<string, string | number>) {
	return Object.entries(params)
		.map(([k, v]) => `${k}=${v}`)
		.join("&")
}
