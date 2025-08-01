import { useId, type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import { Button } from "./Button.tsx"
import { Field } from "./Field.tsx"
import { Input } from "./Input.tsx"
import {
	useEditableNumber,
	type EditableNumberConfig,
} from "./useEditableNumber.ts"

interface EditableNumberProps extends EditableNumberConfig {
	id?: string
	className?: string
}

export function EditableNumber({
	id,
	className,
	value: valueProp,
	min,
	max,
	onChange,
}: EditableNumberProps) {
	const { rootProps, isEditing, inputProps, buttonProps, value } =
		useEditableNumber({ value: valueProp, min, max, onChange })

	return (
		<div {...rootProps()} className={twMerge("grid", className)}>
			{isEditing ?
				<Input {...inputProps()} id={id} align="center" />
			:	<Button {...buttonProps()} id={id} align="center">
					{value}
				</Button>
			}
		</div>
	)
}

export function EditableNumberField({
	label,
	className,
	...props
}: ComponentProps<typeof EditableNumber> & { label: ReactNode }) {
	const id = useId()
	return (
		<Field label={label} htmlFor={props.id ?? id} className={className}>
			<EditableNumber id={id} {...props} />
		</Field>
	)
}
