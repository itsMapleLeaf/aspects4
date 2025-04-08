import * as Ariakit from "@ariakit/react"
import { ArkErrors, type } from "arktype"
import { clamp } from "es-toolkit"
import type { ReactNode } from "react"
import { twMerge, type ClassNameValue } from "tailwind-merge"
import { CharacterSheet } from "./components/CharacterSheet.tsx"
import { Icon } from "./components/ui/Icon.tsx"
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
			<div className="pointer-events-children fixed inset-y-0 left-0">
				<Sidebar />
			</div>
		</>
	)
}

function Sidebar() {
	return (
		<Ariakit.TabProvider defaultActiveId="Characters">
			<div className="flex h-full flex-col items-start gap-2 p-4">
				<Ariakit.TabList className={panel("flex gap-1 p-1")}>
					<SidebarTab
						name="Characters"
						icon={<Icon icon="mingcute:group-2-fill" className="size-5" />}
					/>
					<SidebarTab
						name="Assets"
						icon={<Icon icon="mingcute:pic-fill" className="size-5" />}
					/>
				</Ariakit.TabList>
				<div className={panel("flex-1 overflow-y-auto will-change-scroll")}>
					<Ariakit.TabPanel id="Characters">
						<CharacterSheet />
					</Ariakit.TabPanel>
					<Ariakit.TabPanel id="Assets">assets</Ariakit.TabPanel>
				</div>
			</div>
		</Ariakit.TabProvider>
	)
}

function SidebarTab({ name, icon }: { name: string; icon: ReactNode }) {
	return (
		<Ariakit.TooltipProvider placement="bottom-start">
			<Ariakit.TooltipAnchor
				render={<Ariakit.Tab id={name} />}
				className="flex size-8 items-center justify-center rounded transition-colors hover:bg-white/5"
			>
				{icon}
			</Ariakit.TooltipAnchor>
			<Ariakit.Tooltip className="translate-y-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm font-bold text-gray-900 opacity-0 transition data-enter:translate-y-0 data-enter:opacity-100">
				{name}
			</Ariakit.Tooltip>
		</Ariakit.TooltipProvider>
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
