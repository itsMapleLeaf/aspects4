import * as Ariakit from "@ariakit/react"
import { type } from "arktype"
import { useQuery } from "convex/react"
import { RefObject, type ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { useDictionary } from "~/hooks/useDictionary.ts"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useLocalStorage, useLocalStorageState } from "../hooks/storage.ts"
import { Character } from "../lib/character.ts"
import { panel } from "../styles/panel.ts"
import { CharacterSheet } from "./CharacterSheet.tsx"
import { ChatInputRef } from "./Chat.tsx"
import { Icon } from "./ui/Icon.tsx"

export function CharacterManager({
	chatInputRef,
	roomId,
}: {
	chatInputRef: RefObject<ChatInputRef | null>
	roomId: Id<"rooms">
}) {
	const characters = useDictionary<Character>({
		initialItems: {},
		fallback: (key) => ({ key, name: "New Character", data: {} }),
	})

	useLocalStorage({
		state: [characters.items, characters.setAll],
		key: "CharacterManager:characters",
		load(input) {
			const result = type.Record("string", Character)(input)
			if (result instanceof type.errors) {
				console.error("Invalid character data", result)
				return {}
			}
			return result
		},
	})

	const localCharacters = characters.values.sort((a, b) =>
		a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
	)

	const sharedCharacters = useQuery(api.characters.list, { roomId })?.flatMap(
		(doc) => {
			const parsed = Character(doc.clientData)
			if (parsed instanceof type.errors) {
				console.warn("Failed to parse character", parsed, doc)
				return []
			}

			// ignore characters that also exist locally
			if (characters.get(parsed.key) != null) {
				return []
			}

			return [parsed]
		},
	)

	const [activeCharacterKey, setActiveCharacterKey] = useLocalStorageState<
		string | undefined | null
	>("CharacterManager:activeCharacterKey", null, (input) =>
		input == null ? null : String(input),
	)

	function addNewCharacter() {
		const character = characters.create(crypto.randomUUID())
		setActiveCharacterKey(character.key)
	}

	return (
		<Ariakit.TabProvider selectedId={activeCharacterKey} orientation="vertical">
			<Ariakit.HeadingLevel level={2}>
				<section className="flex h-full w-full gap-2">
					<Ariakit.TabList
						className={panel("flex w-48 flex-col gap-2 px-3 pt-2 pb-1")}
					>
						<header className="flex items-center justify-between">
							<h2 className="heading-xl leading-none">Characters</h2>
							<button
								type="button"
								className="-mr-2 flex size-8 items-center justify-center gap-2 rounded transition-colors hover:bg-white/5"
								onClick={addNewCharacter}
							>
								<Icon icon="mingcute:user-add-2-fill" />
								<span className="sr-only">New Character</span>
							</button>
						</header>

						<ul className="flex flex-col gap-1">
							{localCharacters.map((character, index) => (
								<li key={character.key} className="-mx-2 flex gap-1">
									<SidebarTab
										id={character.key}
										onClick={() => {
											if (activeCharacterKey === character.key) {
												setActiveCharacterKey(null)
											} else {
												setActiveCharacterKey(character.key)
											}
										}}
									>
										<span className="truncate">{character.name}</span>
									</SidebarTab>

									<button
										type="button"
										className="flex aspect-square h-full items-center justify-center rounded transition-colors hover:bg-white/5"
										onClick={() => {
											characters.remove(character.key)

											if (character.key === activeCharacterKey) {
												const nextIndex = Math.min(
													index + 1,
													localCharacters.length - 2, // -1 for the removed character
												)
												const nextKey = localCharacters[nextIndex]?.key ?? null
												setActiveCharacterKey(nextKey)
											}
										}}
									>
										<Icon icon="mingcute:close-fill" />
										<span className="sr-only">Delete Character</span>
									</button>
								</li>
							))}

							{sharedCharacters?.map((character) => (
								<li key={character.key} className="-mx-2 flex gap-1">
									<SidebarTab
										id={character.key}
										onClick={() => {
											if (activeCharacterKey === character.key) {
												setActiveCharacterKey(null)
											} else {
												setActiveCharacterKey(character.key)
											}
										}}
									>
										<span className="truncate">{character.name}</span>
									</SidebarTab>
								</li>
							))}
						</ul>
					</Ariakit.TabList>

					<div className={panel("h-full w-148 flex-1 p-0")}>
						{localCharacters.map((character) => (
							<Ariakit.TabPanel
								id={character.key}
								key={character.key}
								className="contents"
							>
								<CharacterSheet
									className="p-4"
									character={character}
									chatInputRef={chatInputRef}
									roomId={roomId}
									onChange={(newCharacter) =>
										characters.set(character.key, newCharacter)
									}
								/>
							</Ariakit.TabPanel>
						))}

						{sharedCharacters?.map((character) => (
							<Ariakit.TabPanel
								id={character.key}
								key={character.key}
								className="contents"
							>
								<CharacterSheet
									className="p-4"
									character={character}
									chatInputRef={chatInputRef}
									roomId={roomId}
									onChange={() => {}}
								/>
							</Ariakit.TabPanel>
						))}
					</div>
				</section>
			</Ariakit.HeadingLevel>
		</Ariakit.TabProvider>
	)
}

function SidebarTab({
	children,
	...props
}: ComponentProps<typeof Ariakit.Tab>) {
	return (
		<Ariakit.Tab
			type="button"
			{...props}
			className={twMerge(
				"flex h-9 min-w-0 flex-1 cursor-default items-center rounded px-2 transition-colors hover:bg-white/5 aria-selected:bg-white/5 aria-selected:text-primary-300",
				props.className,
			)}
		>
			<span className="truncate">{children}</span>
		</Ariakit.Tab>
	)
}
