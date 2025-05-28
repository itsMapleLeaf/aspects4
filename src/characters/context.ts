import { createContext } from "react"
import { typed } from "../lib/utils.ts"
import type { Character } from "./character.ts"
import { createFieldContext } from "./sheet/fields.ts"

export const CharacterContext = createContext({
	character: typed<Character>({ name: "Unknown Character", values: {} }),
	updateName: (_name: string) => {},
	updateFieldValue: (_key: string, _value: unknown) => {},
})

export const CharacterSheetContext = createContext(
	createFieldContext({}, () => {}),
)
