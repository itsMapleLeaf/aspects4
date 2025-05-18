import { parseNumberSafe } from "~/lib/utils.ts"

export type Character = { name: string; values: CharacterValues }
export type CharacterValues = Record<string, unknown>

export function getCharacterNumberValue(
	character: Character,
	valueName: string,
) {
	return parseNumberSafe(character.values[valueName])
}
