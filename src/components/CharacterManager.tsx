import * as Ariakit from "@ariakit/react"
import { ArkErrors } from "arktype"
import { mapValues } from "es-toolkit"
import { JsonObject } from "type-fest"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { Character } from "../lib/character.ts"
import { panel } from "../styles/panel.ts"
import { CharacterSheet } from "./CharacterSheet.tsx"
import { Icon } from "./ui/Icon.tsx"

export function CharacterManager() {
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
