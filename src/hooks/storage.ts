import { useEffect, useState } from "react"
import type { JsonValue } from "type-fest"
import { useValueRef } from "./common.ts"

export function useLocalStorageState<T>(
	key: string,
	defaultValue: T,
	load: (input: JsonValue) => T,
) {
	const [value, setValue] = useState<T>(defaultValue)
	const [loaded, setLoaded] = useState(false)
	const loadRef = useValueRef(load)

	if (!loaded) {
		try {
			const saved = window.localStorage.getItem(key)
			if (saved) {
				setValue(loadRef.current(JSON.parse(saved) as JsonValue))
			}
			setLoaded(true)
		} catch (error) {
			console.warn("failed to parse", error)
		}
	}

	useEffect(() => {
		if (!loaded) return
		window.localStorage.setItem(key, JSON.stringify(value))
	}, [key, value, loaded])

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
