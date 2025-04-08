export function handleDrag(onDrag: (event: PointerEvent) => void) {
	const controller = new AbortController()

	window.addEventListener(
		"pointermove",
		(event) => {
			if (!(event.buttons & 2)) return
			onDrag(event)
		},
		{
			signal: controller.signal,
		},
	)

	window.addEventListener(
		"pointerup",
		() => {
			controller.abort()
		},
		{ signal: controller.signal },
	)

	window.addEventListener(
		"blur",
		() => {
			controller.abort()
		},
		{ signal: controller.signal },
	)

	window.addEventListener(
		"contextmenu",
		(event) => {
			event.preventDefault()
		},
		{ once: true },
	)
}
