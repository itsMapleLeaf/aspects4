import { safeParseNumber } from "~/lib/utils.ts"

export type Character = { name: string; values: CharacterValues }
export type CharacterValues = Record<string, unknown>

export function getCharacterNumberValue(
	character: Character,
	valueName: string,
) {
	return safeParseNumber(character.values[valueName])
}
