import type { Except, NonEmptyTuple } from "type-fest"

export type CharacterSheet = Readonly<{
	id: string
	systemName: string
	name: string
	blocks: readonly CharacterSheetBlock[]
}>

export type CharacterSheetBlock = Readonly<
	| CharacterSheetContainer
	| CharacterSheetTabNavigator
	| CharacterSheetTextField
	| CharacterSheetNumberField
	| CharacterSheetSelectField
	| CharacterSheetListField
>

export type CharacterSheetField = Readonly<{
	id: string
	displayName?: string
	hint?: string
	className?: string
}>

export type CharacterSheetContainer = Readonly<{
	id: string
	type: "row" | "column"
	children: readonly CharacterSheetBlock[]
}>

export type CharacterSheetTabNavigator = Readonly<{
	id: string
	type: "tabs"
	tabs: NonEmptyTuple<CharacterSheetTab>
}>

export type CharacterSheetTab = Readonly<{
	id: string
	children: readonly CharacterSheetBlock[]
	name?: string
}>

export type CharacterSheetTextField = Readonly<
	CharacterSheetField & {
		type: "text"
		multiline?: boolean
		/** @default 50_000 */
		maxLength?: number
		defaultValue?: string
	}
>

export type CharacterSheetNumberField = {
	type: "number"
	id: string
	displayName?: string
	hint?: string
	className?: string
	defaultValue?: number
	/** @default 0 */
	min?: number
	/** @default Number.POSITIVE_INFINITY */
	max?: number
	optional?: boolean
	labelPlacement?: "default" | "left"
}

export type CharacterSheetSelectField = Readonly<
	CharacterSheetField & {
		type: "select"
		choices: readonly CharacterSchemaSelectChoiceSchema[]
		optional?: boolean
		defaultValue?: string
	}
>

export type CharacterSchemaSelectChoiceSchema = Readonly<{
	id: string
	displayName?: string
	/** Short description displayed under the label of each choice */
	hint?: string
	/** A longer description displayed while this choice is selected */
	description?: string
}>

export type CharacterSheetListField = Readonly<
	CharacterSheetField & {
		type: "list"
		itemFields: readonly CharacterSheetBlock[]
	}
>

let nextId = 0
const createId = () => String(nextId++)

export function row(...children: CharacterSheetBlock[]): CharacterSheetBlock {
	return { id: createId(), type: "row", children }
}

export function column(
	...children: CharacterSheetBlock[]
): CharacterSheetBlock {
	return { id: createId(), type: "column", children }
}

export function tabs(
	...tabs: NonEmptyTuple<CharacterSheetTab>
): CharacterSheetBlock {
	return { id: createId(), type: "tabs", tabs }
}

export function tab(
	id: string,
	children: CharacterSheetBlock[],
	options: Except<CharacterSheetTab, "id" | "children"> = {},
): { id: string; name?: string; children: CharacterSheetBlock[] } {
	return { id, name: options.name, children }
}

export function text(
	id: string,
	options: Except<CharacterSheetTextField, "id" | "type"> = {},
): CharacterSheetBlock {
	return { ...options, id, type: "text" }
}

export function number(
	id: string,
	options: Except<CharacterSheetNumberField, "id" | "type"> = {},
): CharacterSheetBlock {
	return { ...options, id, type: "number" }
}

export function select(
	id: string,
	options: Except<CharacterSheetSelectField, "id" | "type">,
): CharacterSheetBlock {
	return { ...options, id, type: "select" }
}

select.choice = function (
	id: string,
	options: Except<CharacterSchemaSelectChoiceSchema, "id"> = {},
): CharacterSchemaSelectChoiceSchema {
	return {
		id,
		displayName: options.displayName,
		hint: options.hint,
		description: options.description,
	}
}

export function list(
	id: string,
	optionsInput:
		| CharacterSheetBlock[]
		| Except<CharacterSheetListField, "id" | "type">,
): CharacterSheetListField {
	const options =
		Array.isArray(optionsInput) ? { itemFields: optionsInput } : optionsInput
	return { ...options, id, type: "list" }
}
