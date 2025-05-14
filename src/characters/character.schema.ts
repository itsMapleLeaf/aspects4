import type { Except, NonEmptyTuple } from "type-fest"

export type CharacterSheetLayout = Readonly<{
	id: string
	systemName: string
	name: string
	blocks: readonly CharacterSheetBlockSchema[]
}>

export type CharacterSheetBlockSchema = Readonly<
	| CharacterSheetContainerSchema
	| CharacterSheetTabViewSchema
	| CharacterSheetTextFieldSchema
	| CharacterSheetNumberFieldSchema
	| CharacterSheetSelectSchema
	| CharacterSheetListSchema
>

export type CharacterSheetFieldSchema = Readonly<{
	id: string
	displayName?: string
	hint?: string
	className?: string
}>

let nextId = 0
const createId = () => String(nextId++)

export type CharacterSheetContainerSchema = Readonly<{
	id: string
	type: "row" | "column"
	children: readonly CharacterSheetBlockSchema[]
}>

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

export type CharacterSheetTabViewSchema = Readonly<{
	id: string
	type: "tabs"
	tabs: NonEmptyTuple<CharacterSheetTabSchema>
}>

export function tabs(
	...tabs: NonEmptyTuple<CharacterSheetTabSchema>
): CharacterSheetBlockSchema {
	return { id: createId(), type: "tabs", tabs }
}

export type CharacterSheetTabSchema = Readonly<{
	id: string
	children: readonly CharacterSheetBlockSchema[]
	name?: string
}>

export function tab(
	id: string,
	children: CharacterSheetBlockSchema[],
	options: Except<CharacterSheetTabSchema, "id" | "children"> = {},
): { id: string; name?: string; children: CharacterSheetBlockSchema[] } {
	return { id, name: options.name, children }
}

export type CharacterSheetTextFieldSchema = Readonly<
	CharacterSheetFieldSchema & {
		type: "text"
		multiline?: boolean
		/** @default 50_000 */
		maxLength?: number
		defaultValue?: string
	}
>

export function text(
	id: string,
	options: Except<CharacterSheetTextFieldSchema, "id" | "type"> = {},
): CharacterSheetBlockSchema {
	return { ...options, id, type: "text" }
}

export type CharacterSheetNumberFieldSchema = {
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

export function number(
	id: string,
	options: Except<CharacterSheetNumberFieldSchema, "id" | "type"> = {},
): CharacterSheetBlockSchema {
	return { ...options, id, type: "number" }
}

export type CharacterSheetSelectSchema = Readonly<
	CharacterSheetFieldSchema & {
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

export function select(
	id: string,
	choices: CharacterSchemaSelectChoiceSchema[],
	options: Except<CharacterSheetSelectSchema, "id" | "type" | "choices"> = {},
): CharacterSheetBlockSchema {
	return { ...options, id, type: "select", choices }
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

export type CharacterSheetListSchema = Readonly<
	CharacterSheetFieldSchema & {
		type: "list"
		itemFields: readonly CharacterSheetBlockSchema[]
	}
>
