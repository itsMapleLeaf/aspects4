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
			<div className="flex h-full w-full gap-2">
				<Ariakit.TabList className={panel("flex w-44 flex-col gap-1 p-1")}>
					{characters.values.map((character) => (
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
			</div>
		</Ariakit.TabProvider>
	)
}
