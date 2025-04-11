const dragStartThreshold = 8

export function handleDrag({
	onDrag,
	onDragEnd,
}: {
	onDrag: (event: PointerEvent) => void
	onDragEnd?: () => void
}) {
	let movedX = 0
	let movedY = 0
	let dragging = false

	const controller = new AbortController()

	window.addEventListener(
		"pointermove",
		(event) => {
			movedX += event.movementX
			movedY += event.movementY

			if (Math.sqrt(movedX * movedX + movedY * movedY) > dragStartThreshold) {
				dragging = true
				// todo: need to add movedX and movedY to the movement information to the consumer, otherwise the start drag position lags behind a bit
				// but event objects can't be modified, it's a super small thing, and i'm lazy
			}

			if (dragging) {
				onDrag(event)
			}
		},
		{
			signal: controller.signal,
		},
	)

	window.addEventListener(
		"pointerup",
		() => {
			controller.abort()
			if (dragging) onDragEnd?.()
		},
		{ signal: controller.signal },
	)

	window.addEventListener(
		"blur",
		() => {
			controller.abort()
			if (dragging) onDragEnd?.()
		},
		{ signal: controller.signal },
	)

	window.addEventListener(
		"contextmenu",
		(event) => {
			if (dragging) event.preventDefault()
		},
		{ once: true },
	)
}
