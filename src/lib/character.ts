import { type } from "arktype"

export type Character = typeof Character.inferOut
export const Character = type({
	key: "string",
	name: "string",
	data: type.Record("string", "string | number"),
})
