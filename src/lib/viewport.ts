import { type } from "arktype"
import { clamp } from "es-toolkit"

export type ViewportTransform = typeof ViewportTransform.inferOut
export const ViewportTransform = type({
	offset: { x: "number", y: "number" },
	zoom: "number.integer",
})

export const defaultViewportTransform: ViewportTransform = {
	offset: { x: 0, y: 0 },
	zoom: 0,
}

const scaleCoefficient = 1.3

export function getViewportScale(zoom: number) {
	return scaleCoefficient ** zoom
}

export function handleViewportZoom(
	transform: ViewportTransform,
	event: { clientX: number; clientY: number; deltaY: number },
): ViewportTransform {
	const scale = getViewportScale(transform.zoom)
	const newZoom = clamp(transform.zoom - Math.sign(event.deltaY), -10, 10)
	const newScale = 1 * scaleCoefficient ** newZoom

	const newOffsetX =
		event.clientX - (event.clientX - transform.offset.x) * (newScale / scale)
	const newOffsetY =
		event.clientY - (event.clientY - transform.offset.y) * (newScale / scale)

	return { zoom: newZoom, offset: { x: newOffsetX, y: newOffsetY } }
}

export function getViewportCenter(
	transform: ViewportTransform,
	viewportSize: { width: number; height: number },
): { x: number; y: number } {
	const scale = getViewportScale(transform.zoom)
	const centerX = (viewportSize.width / 2 - transform.offset.x) / scale
	const centerY = (viewportSize.height / 2 - transform.offset.y) / scale
	return { x: centerX, y: centerY }
}
