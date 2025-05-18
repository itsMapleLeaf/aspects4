import { useEffect, useState } from "react"
import type { JsonValue } from "type-fest"

export function useLocalStorageState<T>(
	key: string,
	defaultValue: T, // TODO: remove this argument, as this can be accomplished with `load()`
	load: (input: JsonValue) => T,
) {
	// not SSR-safe but we don't care about that rn
	const [value, setValue] = useState<T>(() => {
		try {
			const saved = window.localStorage.getItem(key)
			return saved == null ? defaultValue : load(JSON.parse(saved) as JsonValue)
		} catch (error) {
			console.warn(`failed to parse (key "${key}")`, error)
			return defaultValue
		}
	})

	useEffect(() => {
		window.localStorage.setItem(key, JSON.stringify(value))
	}, [key, value])

	return [value, setValue] as const
}

export function useLocalStorage<T>(options: {
	state: [value: T, setValue: (value: T) => void]
	key: string
	load: (input: JsonValue) => T
}) {
	const [value, setValue] = options.state
	const [loaded, setLoaded] = useState(false)

	if (!loaded) {
		try {
			const saved = window.localStorage.getItem(options.key)
			if (saved) {
				setValue(options.load(JSON.parse(saved) as JsonValue))
			}
		} catch (error) {
			console.warn("failed to parse", error)
		}
		setLoaded(true)
	}

	useEffect(() => {
		if (!loaded) return
		window.localStorage.setItem(options.key, JSON.stringify(value))
	}, [options.key, value, loaded])

	return [value, setValue] as const
}
