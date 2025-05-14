import type { Except, NonEmptyTuple } from "type-fest"

export type CharacterSheetLayout = Readonly<{
	id: string
	systemName: string
	name: string
	blocks: readonly CharacterSheetBlockSchema[]
}>

export type CharacterSheetBlockSchema = Readonly<
	| {
			id: string
			type: "row" | "column"
			children: readonly CharacterSheetBlockSchema[]
	  }
	| { id: string; type: "tabs"; tabs: NonEmptyTuple<CharacterSheetTabSchema> }
	| {
			id: string
			displayName?: string
			hint?: string
			type: "text"
			multiline?: boolean
			/** @default 50_000 */
			maxLength?: number
	  }
	| CharacterSheetNumberSchema
	| {
			id: string
			displayName?: string
			hint?: string
			type: "select"
			choices: readonly CharacterSchemaSelectChoice[]
			optional?: boolean
	  }
	| {
			id: string
			displayName?: string
			hint?: string
			type: "list"
			itemFields: readonly CharacterSheetBlockSchema[]
	  }
>

export type CharacterSheetTabSchema = {
	id: string
	name?: string
	children: readonly CharacterSheetBlockSchema[]
}

export type CharacterSchemaSelectChoice = Readonly<{
	id: string
	displayName?: string
	/** Short description displayed under the label of each choice */
	hint?: string
	/** A longer description displayed while this choice is selected */
	description?: string
}>

let nextId = 0
const createId = () => String(nextId++)

export function row(
	...children: CharacterSheetBlockSchema[]
): CharacterSheetBlockSchema {
	return { id: createId(), type: "row", children }
}

export function column(
	...children: CharacterSheetBlockSchema[]
): CharacterSheetBlockSchema {
	return { id: createId(), type: "column", children }
}

export function tab(
	id: string,
	children: CharacterSheetBlockSchema[],
	options: { name?: string } = {},
): { id: string; name?: string; children: CharacterSheetBlockSchema[] } {
	return { id, name: options.name, children }
}

export function tabs(
	...tabConfigs: NonEmptyTuple<{
		id: string
		name?: string
		children: readonly CharacterSheetBlockSchema[]
	}>
): CharacterSheetBlockSchema {
	return { id: createId(), type: "tabs", tabs: tabConfigs }
}

export function text(
	id: string,
	options: {
		displayName?: string
		hint?: string
		multiline?: boolean
		maxLength?: number
	} = {},
): CharacterSheetBlockSchema {
	return { id, type: "text", ...options }
}

export type CharacterSheetNumberSchema = {
	id: string
	displayName?: string
	hint?: string
	type: "number"
	/** @default 0 */
	min?: number
	/** @default Number.POSITIVE_INFINITY */
	max?: number
	optional?: boolean
	labelPlacement?: "default" | "left"
}

export function number(
	id: string,
	options: Except<CharacterSheetNumberSchema, "id" | "type"> = {},
): CharacterSheetBlockSchema {
	return { ...options, id, type: "number" }
}

export function select(
	id: string,
	choices: CharacterSchemaSelectChoice[],
	options: { displayName?: string; hint?: string; optional?: boolean } = {},
): CharacterSheetBlockSchema {
	return { id, type: "select", choices, ...options }
}

select.choice = function (
	id: string,
	options: { displayName?: string; hint?: string; description?: string } = {},
): CharacterSchemaSelectChoice {
	return {
		id,
		displayName: options.displayName,
		hint: options.hint,
		description: options.description,
	}
}
