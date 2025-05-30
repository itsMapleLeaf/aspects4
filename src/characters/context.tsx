import { useMutation } from "convex/react"
import { createContext, use } from "react"
import { api } from "../../convex/_generated/api"
import type { NormalizedCharacter } from "../../convex/characters.ts"
import { raise } from "../lib/utils.ts"
import { createFieldContext } from "./sheet/fields.ts"

export const EditorCharacterContext = createContext<NormalizedCharacter | null>(
	null,
)

export function useEditorCharacter() {
	return (
		use(EditorCharacterContext) ?? raise("editor character id not provided")
	)
}

export function useUpdateEditorCharacter() {
	const characterId = useEditorCharacter()._id
	const updateCharacter = useMutation(api.characters.update)
	return (data: Parameters<typeof updateCharacter>[0]["data"]) => {
		updateCharacter({
			characterId,
			data,
		})
	}
}

export function useEditorCharacterSheet() {
	const character = useEditorCharacter()
	const update = useUpdateEditorCharacter()
	return createFieldContext(character.data, (name, value) => {
		update({
			data: { [name]: value },
		})
	})
}
