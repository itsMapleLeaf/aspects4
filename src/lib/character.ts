import { type } from "arktype"

export type CharacterBond = typeof CharacterBond.inferOut
const CharacterBond = type({
	name: "string",
	description: "string",
	strength: "number",
})

export type Character = typeof Character.inferOut
export const Character = type({
	"key": "string",
	"name": "string",
	"data": `Record<string, string | number>`,
	"bonds?": CharacterBond.array(),
})
