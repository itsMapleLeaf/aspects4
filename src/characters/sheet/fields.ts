import { clamp } from "es-toolkit"
import { parseNumberSafe } from "../../lib/utils.ts"
import type { SelectChoice } from "../../components/ui/SelectField.tsx"

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
	{
		min = 0,
		max = Number.POSITIVE_INFINITY,
		...options
	}: { id: string; defaultValue?: number; min?: number; max?: number },
) {
	return {
		id: options.id,
		value: clamp(
			parseNumberSafe(context.values[options.id]) ?? options.defaultValue ?? 0,
			min,
			max,
		),
		min,
		max,
		context,
	}
}

export type ResolvedBooleanField = ReturnType<typeof resolveBooleanField>
export function resolveBooleanField(
	context: FieldContext,
	options: { id: string; defaultValue?: boolean },
) {
	const currentValue = context.values[options.id]
	return {
		id: options.id,
		value: currentValue == null ? options.defaultValue : !!currentValue,
		set: (value: boolean) => {
			context.updateValue(options.id, value)
		},
	}
}

export type ResolvedSelectField = ReturnType<typeof resolveSelectField>

export type ResolvedSelectChoice = SelectChoice & {
	/**
	 * Displays beneath the select label on the popover; if not provided, uses
	 * description instead
	 */
	hint?: string
}

export function resolveSelectField<Value extends string>(
	context: FieldContext,
	config: {
		id: string
		defaultValue?: Value
		choices: readonly (ResolvedSelectChoice & { value: Value })[]
	},
) {
	const value = String(context.values[config.id] ?? config.defaultValue ?? "")
	const currentOption = config.choices.find((opt) => opt.value === value)
	return {
		id: config.id,
		value: currentOption?.value ?? ("" as const),
		choices: config.choices,
		currentOption,
		context,
	}
}

export type ResolvedListField = ReturnType<typeof resolveListField>
export type ResolvedListFieldItemValues = Record<string, unknown>

export function resolveListField(context: FieldContext, id: string) {
	const items: ResolvedListFieldItemValues[] = []
	if (Array.isArray(context.values[id])) {
		for (const item of context.values[id]) {
			if (typeof item === "object" && item != null) {
				items.push(item as Record<string, unknown>)
			}
		}
	}

	return {
		id,
		items,
		setItems: (items: ResolvedListFieldItemValues[]) => {
			context.updateValue(id, items)
		},
	}
}

export function createResolvedListItemContext(
	item: ResolvedListFieldItemValues,
	resolved: ResolvedListField,
	index: number,
): FieldContext {
	return createFieldContext(item, (key, value) => {
		resolved.setItems(resolved.items.with(index, { ...item, [key]: value }))
	})
}
