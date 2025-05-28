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
