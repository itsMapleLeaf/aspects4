import { type ComponentProps, type ReactNode, useId } from "react"
import { EditableText } from "./EditableText.tsx"
import { Field } from "./ui/Field.tsx"

export function EditableTextField({
	className,
	label,
	...props
}: ComponentProps<typeof EditableText> & { label: ReactNode }) {
	const id = useId()
	return (
		<Field className={className} label={label} htmlFor={id}>
			<EditableText id={id} {...props} />
		</Field>
	)
}
