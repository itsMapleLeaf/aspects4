import { clamp } from "es-toolkit"
import type { Except, NonEmptyTuple } from "type-fest"
import { parseNumberSafe } from "~/lib/utils.ts"
import { type Character } from "./character.ts"

export type CharacterSheet = Readonly<{
	id: string
	systemName: string
	name: string
	render: (character: Character) => readonly CharacterSheetBlock[]
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

export function row(
	id: string,
	...children: CharacterSheetBlock[]
): CharacterSheetBlock {
	return { id, type: "row", children }
}

export function column(
	id: string,
	...children: CharacterSheetBlock[]
): CharacterSheetBlock {
	return { id, type: "column", children }
}

export function tabs(
	id: string,
	...tabs: NonEmptyTuple<CharacterSheetTab>
): CharacterSheetBlock {
	return { id, type: "tabs", tabs }
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

export type CharacterSheetNumberField = ReturnType<typeof numberField>

export function numberField(
	character: Character,
	id: string,
	options: {
		displayName?: string
		hint?: string
		defaultValue?: number
		/** @default 0 */
		min?: number
		/** @default Number.POSITIVE_INFINITY */
		max?: number
		optional?: boolean
		labelPlacement?: "default" | "left"
	} = {},
) {
	const field = {
		...options,
		type: "number" as const,
		id,
		min: options.min ?? 0,
		max: options.max ?? Number.POSITIVE_INFINITY,
		get value(): number {
			const value = parseNumberSafe(character.values[id])
			return clamp(value ?? this.defaultValue ?? 0, this.min, this.max)
		},
	}
	return field
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
