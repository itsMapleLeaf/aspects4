import { ComponentProps, ReactNode, useId } from "react"
import { twMerge } from "tailwind-merge"
import { useEditableNumber } from "~/components/useEditableNumber.ts"
import { EditableNumberField } from "../../components/EditableNumber.tsx"
import { EditableTextField } from "../../components/EditableTextField.tsx"
import { SelectField } from "../../components/ui/SelectField.tsx"
import { Tooltip } from "../../components/ui/Tooltip.tsx"
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
	tooltip: tooltipContent,
	...props
}: {
	resolved: ResolvedNumberField
	label?: ReactNode
	tooltip?: ReactNode
} & ComponentProps<"div">) {
	const fieldId = useId()

	const editable = useEditableNumber({
		value: field.value,
		min: field.min,
		max: field.max,
		onChange: (value) => field.context.updateValue(field.id, value),
	})

	return (
		<div
			className={twMerge(
				"flex min-h-10 overflow-clip rounded-md border border-gray-800 bg-black/25",
				props.className,
			)}
		>
			<Tooltip
				render={<label htmlFor={fieldId} />}
				content={tooltipContent}
				placement="top-start"
				className="flex flex-1 items-center rounded-l-md rounded-r-none px-3 py-1.5 leading-tight font-semibold transition ring-inset hover:text-primary-300"
			>
				{label ?? toTitleCase(field.id)}
			</Tooltip>

			<div
				{...editable.rootProps()}
				className="w-16 rounded-r-md bg-black/25 outline-2 -outline-offset-2 outline-transparent transition *:size-full focus-within:bg-black/50 focus-within:outline-primary-400 hover:bg-black/50"
			>
				{editable.isEditing ?
					<input
						{...editable.inputProps()}
						id={fieldId}
						className="h-full text-center leading-none focus:outline-none"
					/>
				:	<button
						{...editable.buttonProps()}
						id={fieldId}
						className="h-full text-center leading-none focus:outline-none"
					>
						{editable.value}
					</button>
				}
			</div>
		</div>
	)
}

export function SheetSelectField({
	resolved: field,
	className,
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
		<div className={className}>
			<SelectField
				{...props}
				label={label}
				placeholder={placeholder}
				value={field.value}
				choices={field.choices.map((opt) => ({
					...opt,
					description: opt.hint ?? opt.description,
				}))}
				onChangeValue={(value) => field.context.updateValue(field.id, value)}
			/>
			<p className="mt-0.5 mb-1 text-sm text-gray-300 empty:hidden">
				{field.choices?.find((opt) => opt.value === field.value)?.description}
			</p>
		</div>
	)
}
