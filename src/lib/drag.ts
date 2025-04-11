export function handleDrag({
	onDrag,
	onDragEnd,
}: {
	onDrag: (event: PointerEvent) => void
	onDragEnd?: () => void
}) {
	const controller = new AbortController()

	window.addEventListener(
		"pointermove",
		(event) => {
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
			onDragEnd?.()
		},
		{ signal: controller.signal },
	)

	window.addEventListener(
		"blur",
		() => {
			controller.abort()
			onDragEnd?.()
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
