import { ComponentProps, ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import {
	EditableNumber,
	EditableNumberField,
} from "../../components/EditableNumber.tsx"
import { EditableTextField } from "../../components/EditableTextField.tsx"
import { SelectField } from "../../components/ui/SelectField.tsx"
import { toTitleCase } from "../../lib/utils.ts"
import type {
	resolveNumberField,
	resolveSelectField,
	resolveTextField,
} from "./fields.tsx"

export function SheetTextField({
	resolved: field,
	...props
}: { resolved: ReturnType<typeof resolveTextField> } & Partial<
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
}: { resolved: ReturnType<typeof resolveNumberField> } & Partial<
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
	resolved: ReturnType<typeof resolveNumberField>
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
}: { resolved: ReturnType<typeof resolveSelectField> } & Partial<
	ComponentProps<typeof SelectField>
>) {
	return (
		<div>
			<SelectField
				{...props}
				label={props.label ?? toTitleCase(field.id)}
				value={field.value}
				options={field.options.map((opt) => ({
					...opt,
					description: opt.hint ?? opt.description,
				}))}
				placeholder={props.placeholder ?? `Select ${toTitleCase(field.id)}`}
				onChangeValue={(value) => field.context.updateValue(field.id, value)}
			/>
			<p className="mt-0.5 text-sm text-gray-300">
				{field.options?.find((opt) => opt.value === field.value)?.description}
			</p>
		</div>
	)
}
