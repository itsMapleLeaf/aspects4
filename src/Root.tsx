import * as Ariakit from "@ariakit/react"
import { ArkErrors } from "arktype"
import { mapValues } from "es-toolkit"
import { type ReactNode } from "react"
import { twMerge, type ClassNameValue } from "tailwind-merge"
import type { JsonObject } from "type-fest"
import { CharacterSheet } from "./components/CharacterSheet.tsx"
import { Icon } from "./components/ui/Icon.tsx"
import { useLocalStorage } from "./hooks/useLocalStorage.ts"
import { Character } from "./lib/character.ts"
import {
	defaultViewportTransform,
	getViewportScale,
	handleViewportZoom,
	ViewportTransform,
} from "./lib/viewport.ts"
import mapUrl from "./map.jpg"

const panel = (...classes: ClassNameValue[]) =>
	twMerge(
		"rounded-md border overflow-clip border-gray-800 bg-gray-900 p-3 shadow-md shadow-black/50",
		...classes,
	)

export function Root() {
	return (
		<>
			<SceneViewer />
			<div className="fixed top-0 left-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Sidebar />
			</div>
			<div className="fixed right-0 bottom-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Chat />
			</div>
		</>
	)
}

function Sidebar() {
	const [selectedTabId, setSelectedTabId] = useLocalStorage<
		string | undefined | null
	>("Sidebar:selectedTabId", null, (input) =>
		input == null ? null : String(input),
	)

	return (
		<Ariakit.TabProvider
			selectedId={selectedTabId}
			setSelectedId={setSelectedTabId}
		>
			<div className="flex h-full flex-col items-start gap-2">
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

				<Ariakit.TabPanel id="Characters" className="min-h-0 flex-1">
					<CharacterManager />
				</Ariakit.TabPanel>
				<Ariakit.TabPanel id="Assets" className="min-h-0 flex-1">
					assets
				</Ariakit.TabPanel>
			</div>
		</Ariakit.TabProvider>
	)
}

function SidebarTab({ name, icon }: { name: string; icon: ReactNode }) {
	const store = Ariakit.useTabContext()
	const selectedTabId = Ariakit.useStoreState(
		store,
		(state) => state?.selectedId,
	)
	return (
		<Ariakit.TooltipProvider placement="bottom-start">
			<Ariakit.Tab
				id={name}
				className="aria-selected:text-primary-300 flex size-8 items-center justify-center rounded transition-colors hover:bg-white/5 aria-selected:bg-white/5"
				render={<Ariakit.TooltipAnchor />}
				onClick={() => {
					if (selectedTabId === name) {
						store?.setSelectedId(null)
					} else {
						store?.setSelectedId(name)
					}
				}}
			>
				{icon}
			</Ariakit.Tab>
			<Ariakit.Tooltip className="translate-y-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm font-bold text-gray-900 opacity-0 transition data-enter:translate-y-0 data-enter:opacity-100">
				{name}
			</Ariakit.Tooltip>
		</Ariakit.TooltipProvider>
	)
}

function CharacterManager() {
	const [characterDict, setCharacterDict] = useLocalStorage<
		Record<Character["key"], Character>
	>("CharacterManager:characters", {}, (input) => {
		if (typeof input !== "object") return {}
		if (input == null) return {}
		if (Array.isArray(input)) return {}

		return mapValues(input as JsonObject, (value) => {
			const character = Character(value)
			if (character instanceof ArkErrors) {
				console.warn(character)
				return {
					key: crypto.randomUUID(),
					name: "New Character",
					data: {},
				}
			}
			return character
		})
	})

	const characters = Object.values(characterDict)

	const [activeCharacterKey, setActiveCharacterKey] = useLocalStorage<
		string | undefined | null
	>("CharacterManager:activeCharacterKey", null, (input) =>
		input == null ? null : String(input),
	)

	function addNewCharacter() {
		setCharacterDict((characters) => {
			const newCharacter: Character = {
				key: crypto.randomUUID(),
				name: "New Character",
				data: {},
			}
			setActiveCharacterKey(newCharacter.key)
			return { ...characters, [newCharacter.key]: newCharacter }
		})
	}

	function setCharacterName(character: Character, name: Character["name"]) {
		setCharacterDict((characters) => ({
			...characters,
			[character.key]: {
				key: crypto.randomUUID(),
				data: {},
				...characters[character.key],
				name,
			},
		}))
	}

	function updateCharacterData(
		key: Character["key"],
		newData: Character["data"],
	) {
		setCharacterDict((characters) => ({
			...characters,
			[key]: {
				key: crypto.randomUUID(),
				name: "",
				...characters[key],
				data: {
					...characters[key]?.data,
					...newData,
				},
			},
		}))
	}

	return (
		<Ariakit.TabProvider selectedId={activeCharacterKey} orientation="vertical">
			<div className="flex h-full w-full gap-2">
				<Ariakit.TabList className={panel("flex w-44 flex-col gap-1 p-1")}>
					{characters.map((character) => (
						<Ariakit.Tab
							key={character.key}
							id={character.key}
							type="button"
							className="aria-selected:text-primary-300 flex h-9 items-center rounded px-3 transition-colors hover:bg-white/5 aria-selected:bg-white/5"
							onClick={() => {
								if (activeCharacterKey === character.key) {
									setActiveCharacterKey(null)
								} else {
									setActiveCharacterKey(character.key)
								}
							}}
						>
							{character.name}
						</Ariakit.Tab>
					))}

					<button
						type="button"
						className="flex h-9 items-center gap-2 rounded px-3 transition-colors hover:bg-white/5"
						onClick={addNewCharacter}
					>
						<Icon icon="mingcute:user-add-2-fill" />
						New Character
					</button>
				</Ariakit.TabList>

				{characters.map((character) => (
					<Ariakit.TabPanel
						id={character.key}
						key={character.key}
						className={panel("min-h-0 w-148 flex-1 p-0")}
					>
						<div className="h-full overflow-y-auto p-4 will-change-scroll">
							<CharacterSheet
								character={character}
								onNameChange={(name) => {
									setCharacterName(character, name)
								}}
								onDataChange={(newData) => {
									updateCharacterData(character.key, newData)
								}}
							/>
						</div>
					</Ariakit.TabPanel>
				))}
			</div>
		</Ariakit.TabProvider>
	)
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
		if (event.button !== 2) return

		event.preventDefault()
		handleDrag((event) => {
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

function Chat() {
	return (
		<div className="flex h-full w-64 flex-col gap-2">
			<div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-y-auto">
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
				<div className={panel("flex flex-col")}>
					<p className="text-sm text-gray-300">sender</p>
					<p>message</p>
				</div>
			</div>
			<div className={panel("p-0")}>
				<textarea
					placeholder="Say something!"
					className="block field-sizing-content w-full resize-none px-3 py-2"
				/>
			</div>
		</div>
	)
}
