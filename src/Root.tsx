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

const scaleCoefficient = 1.3

function SceneViewer() {
	const [offset, setOffset] = useLocalStorage<readonly [number, number]>(
		"viewport:offset",
		[0, 0],
		(input) => {
			if (!Array.isArray(input)) return [0, 0]
			return [Number(input[0]) || 0, Number(input[1]) || 0]
		},
	)
	const [zoom, setZoom] = useLocalStorage("viewport:zoom", 0, Number)
	const scale = 1 * scaleCoefficient ** zoom

	return (
		<div
			className="relative h-dvh w-dvw overflow-clip"
			onPointerDown={(event) => {
				event.preventDefault()

				if (event.button === 2) {
					const controller = new AbortController()

					window.addEventListener(
						"pointermove",
						(event) => {
							if (event.buttons & 2) {
								setOffset(([x, y]) => [
									x + event.movementX,
									y + event.movementY,
								])
							}
						},
						{ signal: controller.signal },
					)

					window.addEventListener("pointerup", () => controller.abort(), {
						signal: controller.signal,
					})

					window.addEventListener("blur", () => controller.abort(), {
						signal: controller.signal,
					})

					window.addEventListener(
						"contextmenu",
						(event) => event.preventDefault(),
						{ once: true },
					)
				}
			}}
			onWheel={(event) => {
				const newZoom = clamp(zoom - Math.sign(event.deltaY), -10, 10)
				const newScale = 1 * scaleCoefficient ** newZoom

				const [x, y] = offset

				const newOffsetX =
					event.clientX - (event.clientX - x) * (newScale / scale)
				const newOffsetY =
					event.clientY - (event.clientY - y) * (newScale / scale)

				setZoom(newZoom)
				setOffset([newOffsetX, newOffsetY])
			}}
		>
			<div
				className="absolute top-0 left-0 origin-top-left transition-[scale,translate] duration-100 ease-out"
				style={{
					translate: `${offset[0]}px ${offset[1]}px`,
					scale,
				}}
			>
				<img src={mapUrl} draggable={false} className="max-w-[unset]" />
			</div>
		</div>
	)
}
