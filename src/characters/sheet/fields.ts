import { parseNumberSafe } from "~/lib/utils.ts"

export type FieldContext = {
	values: Record<string, unknown>
	updateValue: (name: string, value: unknown) => void
}

export function createFieldContext(
	values: Record<string, unknown>,
	updateValue: (name: string, value: unknown) => void,
): FieldContext {
	return { values, updateValue }
}

export type ResolvedTextField = ReturnType<typeof resolveTextField>
export function resolveTextField(
	context: FieldContext,
	options: { id: string; defaultValue?: string },
) {
	return {
		id: options.id,
		value: String(context.values[options.id] ?? options.defaultValue ?? ""),
		context,
	}
}

export type ResolvedNumberField = ReturnType<typeof resolveNumberField>
export function resolveNumberField(
	context: FieldContext,
	options: { id: string; defaultValue?: number; min?: number; max?: number },
) {
	return {
		id: options.id,
		value:
			parseNumberSafe(context.values[options.id]) ?? options.defaultValue ?? 0,
		min: options.min ?? 0,
		max: options.max ?? Number.POSITIVE_INFINITY,
		context,
	}
}

export type ResolvedSelectField = ReturnType<typeof resolveSelectField>
export function resolveSelectField(
	context: FieldContext,
	options: {
		id: string
		defaultValue?: string
		options: Array<{
			value: string
			label: string
			/** Displays beneath the select while this option is selected */
			description?: string
			/**
			 * Displays beneath the select label on the popover; if not provided, uses
			 * description instead
			 */
			hint?: string
		}>
	},
) {
	const value = String(context.values[options.id] ?? options.defaultValue ?? "")
	const currentOption = options.options.find((opt) => opt.value === value)
	return {
		id: options.id,
		value: value,
		options: options.options,
		currentOption,
		context,
	}
}
