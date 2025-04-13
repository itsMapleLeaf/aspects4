import { useState } from "react"

export function useDictionary<T>({
	initialItems = {},
	fallback,
}: {
	initialItems?: Record<string, T>
	fallback: (key: string) => T
}) {
	const [items, setItems] = useState(initialItems)

	function update(key: string, value: (current: T) => T) {
		setItems((current) => ({
			...current,
			[key]: value(current[key] ?? fallback(key)),
		}))
	}

	function set(key: string, value: T) {
		update(key, () => value)
	}

	function setAll(items: Record<string, T>) {
		setItems(items)
	}

	function create(key: string) {
		const item = fallback(key)
		set(key, item)
		return item
	}

	function patch(key: string, value: Partial<T>) {
		update(key, (current) => ({
			...(current ?? fallback(key)),
			...value,
		}))
	}

	function remove(key: string) {
		setItems((current) => {
			const { [key]: _removed, ...rest } = current
			return rest
		})
	}

	function clear() {
		setItems({})
	}

	function get(key: string) {
		return items[key]
	}

	return {
		items,
		update,
		set,
		setAll,
		create,
		patch,
		remove,
		clear,
		get,
		get keys() {
			return Object.keys(items)
		},
		get values() {
			return Object.values(items)
		},
		get entries() {
			return Object.entries(items)
		},
	}
}
