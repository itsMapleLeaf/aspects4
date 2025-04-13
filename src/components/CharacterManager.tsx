import * as Ariakit from "@ariakit/react"
import { type } from "arktype"
import { RefObject } from "react"
import { useDictionary } from "~/hooks/useDictionary.ts"
import { useLocalStorage, useLocalStorageState } from "../hooks/storage.ts"
import { Character } from "../lib/character.ts"
import { panel } from "../styles/panel.ts"
import { CharacterSheet } from "./CharacterSheet.tsx"
import { ChatInputRef } from "./Chat.tsx"
import { Icon } from "./ui/Icon.tsx"

export function CharacterManager({
	chatInputRef,
}: {
	chatInputRef: RefObject<ChatInputRef | null>
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
							{characters.values.map((character, index) => (
								<li key={character.key} className="-mx-2 flex gap-1">
									<Ariakit.Tab
										id={character.key}
										type="button"
										className="flex h-9 min-w-0 flex-1 cursor-default items-center rounded px-2 transition-colors hover:bg-white/5 aria-selected:bg-white/5 aria-selected:text-primary-300"
										onClick={() => {
											if (activeCharacterKey === character.key) {
												setActiveCharacterKey(null)
											} else {
												setActiveCharacterKey(character.key)
											}
										}}
									>
										<span className="truncate">{character.name}</span>
									</Ariakit.Tab>

									<button
										type="button"
										className="flex aspect-square h-full items-center justify-center rounded transition-colors hover:bg-white/5"
										onClick={() => {
											characters.remove(character.key)

											if (character.key === activeCharacterKey) {
												const nextIndex = Math.min(
													index + 1,
													characters.values.length - 2, // -1 for the removed character
												)
												const nextKey =
													characters.values[nextIndex]?.key ?? null
												setActiveCharacterKey(nextKey)
											}
										}}
									>
										<Icon icon="mingcute:close-fill" />
										<span className="sr-only">Delete Character</span>
									</button>
								</li>
							))}
						</ul>
					</Ariakit.TabList>

					{characters.values.map((character) => (
						<Ariakit.TabPanel
							id={character.key}
							key={character.key}
							className={panel("min-h-0 w-148 flex-1 p-0")}
						>
							<div className="h-full overflow-y-auto p-4 will-change-scroll">
								<CharacterSheet
									character={character}
									chatInputRef={chatInputRef}
									onChange={(newCharacter) =>
										characters.set(character.key, newCharacter)
									}
								/>
							</div>
						</Ariakit.TabPanel>
					))}
				</section>
			</Ariakit.HeadingLevel>
		</Ariakit.TabProvider>
	)
}
