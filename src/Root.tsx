import { ArkErrors, type } from "arktype"
import { clamp } from "es-toolkit"
import { twMerge, type ClassNameValue } from "tailwind-merge"
import { CharacterSheet } from "./components/CharacterSheet.tsx"
import { useLocalStorage } from "./hooks/useLocalStorage.ts"
import mapUrl from "./map.jpg"

// import aspectSkillList from "./data/list-of-aspect-skills.json"
// import skillList from "./data/list-of-skills.json"

// const skillsByAttribute = Object.groupBy(skillList, (skill) => skill.attribute)

// const aspectSkillsByAspect = Object.groupBy(
// 	aspectSkillList,
// 	(skill) => skill.aspect,
// )

const panel = (...classes: ClassNameValue[]) =>
	twMerge("rounded-md border border-gray-800 bg-gray-900 p-3", ...classes)

export function Root() {
	return (
		<>
			<SceneViewer />
			<div className="fixed inset-y-0 left-0 max-w-xl p-4" hidden>
				<div className={panel("h-full overflow-y-auto will-change-scroll")}>
					<CharacterSheet />
				</div>
			</div>
		</>
	)
}

type ViewportTransform = typeof ViewportTransform.inferOut
const ViewportTransform = type({
	offset: { x: "number", y: "number" },
	zoom: "number.integer",
})

const defaultViewportTransform: ViewportTransform = {
	offset: { x: 0, y: 0 },
	zoom: 0,
}

const scaleCoefficient = 1.3

function getViewportScale(zoom: number) {
	return scaleCoefficient ** zoom
}

function handleViewportZoom(
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

function SceneViewer() {
	const [viewportTransform, setViewportTransform] =
		useLocalStorage<ViewportTransform>(
			"viewportTransform",
			defaultViewportTransform,
			(input) => {
				const result = ViewportTransform(input)
				if (result instanceof ArkErrors) {
					console.warn(result)
					return defaultViewportTransform
				}
				return result
			},
		)

	const handlePointerDown = (event: React.PointerEvent) => {
		event.preventDefault()

		if (event.button !== 2) return

		handleDrag((event) => {
			if (!(event.buttons & 2)) return
			setViewportTransform((transform) => ({
				...transform,
				offset: {
					x: transform.offset.x + event.movementX,
					y: transform.offset.y + event.movementY,
				},
			}))
		})
	}

	const handleWheel = (event: React.WheelEvent) => {
		setViewportTransform((transform) => handleViewportZoom(transform, event))
	}

	return (
		<div
			className="relative h-dvh w-dvw overflow-clip"
			onPointerDown={handlePointerDown}
			onWheel={handleWheel}
		>
			<div
				className="absolute top-0 left-0 origin-top-left transition-[scale,translate] duration-100 ease-out"
				style={{
					translate: `${viewportTransform.offset.x}px ${viewportTransform.offset.y}px`,
					scale: getViewportScale(viewportTransform.zoom),
				}}
			>
				<img src={mapUrl} draggable={false} className="max-w-[unset]" />
			</div>
		</div>
	)
}

function handleDrag(onDrag: (event: PointerEvent) => void) {
	const controller = new AbortController()

	window.addEventListener("pointermove", onDrag, {
		signal: controller.signal,
	})

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
