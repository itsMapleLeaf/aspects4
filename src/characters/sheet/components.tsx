import { ComponentProps, ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import {
	EditableNumber,
	EditableNumberField,
} from "../../components/EditableNumber.tsx"
import { EditableTextField } from "../../components/EditableTextField.tsx"
import { SelectField } from "../../components/ui/SelectField.tsx"
import { lowerFirst, toTitleCase } from "../../lib/utils.ts"
import type {
	ResolvedNumberField,
	ResolvedSelectField,
	ResolvedTextField,
} from "./fields.ts"

export function SheetTextField({
	resolved: field,
	...props
}: { resolved: ResolvedTextField } & Partial<
	ComponentProps<typeof EditableTextField>
>) {
	return (
		<EditableTextField
			{...props}
			label={props.label ?? toTitleCase(field.id)}
			value={field.value}
			onChange={(value) => field.context.updateValue(field.id, value)}
		/>
	)
}

export function SheetNumberField({
	resolved: field,
	...props
}: { resolved: ResolvedNumberField } & Partial<
	ComponentProps<typeof EditableNumberField>
>) {
	return (
		<EditableNumberField
			{...props}
			label={props.label ?? toTitleCase(field.id)}
			value={field.value}
			min={field.min}
			max={field.max}
			onChange={(value) => field.context.updateValue(field.id, value)}
		/>
	)
}

export function SheetStatField({
	resolved: field,
	label,
	...props
}: {
	resolved: ResolvedNumberField
	label?: ReactNode
} & Partial<ComponentProps<typeof EditableNumber>>) {
	return (
		<div className={twMerge("flex", props.className)}>
			<div className="flex flex-1 items-center px-3 font-semibold">
				{label ?? toTitleCase(field.id)}
			</div>
			<EditableNumber
				{...props}
				className="w-16"
				value={field.value}
				min={field.min}
				max={field.max}
				onChange={(value) => field.context.updateValue(field.id, value)}
			/>
		</div>
	)
}

export function SheetSelectField({
	resolved: field,
	...props
}: { resolved: ResolvedSelectField } & Partial<
	ComponentProps<typeof SelectField>
>) {
	const label = props.label ?? toTitleCase(field.id)

	const placeholder =
		props.placeholder ??
		(typeof props.label === "string" ?
			`Choose a ${lowerFirst(props.label)}`
		:	`Choose a ${lowerFirst(toTitleCase(field.id))}`)

	return (
		<div>
			<SelectField
				{...props}
				label={label}
				placeholder={placeholder}
				value={field.value}
				options={field.options.map((opt) => ({
					...opt,
					description: opt.hint ?? opt.description,
				}))}
				onChangeValue={(value) => field.context.updateValue(field.id, value)}
			/>
			<p className="mt-0.5 mb-1 text-sm text-gray-300 empty:hidden">
				{field.options?.find((opt) => opt.value === field.value)?.description}
			</p>
		</div>
	)
}
