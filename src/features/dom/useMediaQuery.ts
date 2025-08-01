import { useEffect, useState } from "react"

/**
 * Custom hook to track media query state
 *
 * @param query - CSS media query string (e.g., "(min-width: 1280px)")
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => {
		if (typeof window === "undefined") return false
		return window.matchMedia(query).matches
	})

	useEffect(() => {
		const mediaQuery = window.matchMedia(query)
		const abortController = new AbortController()

		setMatches(mediaQuery.matches)
		mediaQuery.addEventListener(
			"change",
			(event) => {
				setMatches(event.matches)
			},
			{ signal: abortController.signal },
		)

		return () => {
			abortController.abort()
		}
	}, [query])

	return matches
}
