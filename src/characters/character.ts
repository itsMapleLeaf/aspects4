import type { NormalizedCharacter } from "../../convex/characters.ts"
import { parseNumberSafe } from "../lib/utils.ts"

export type Character = Pick<NormalizedCharacter, "name" | "data" | "isPublic">
export type CharacterValues = Record<string, unknown>

export function getCharacterNumberValue(
	character: Character,
	valueName: string,
) {
	return parseNumberSafe(character.data[valueName])
}
