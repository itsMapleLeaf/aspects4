import { type ComponentProps, type ReactNode, useId } from "react"
import { EditableText } from "./EditableText.tsx"
import { Field } from "./ui/Field.tsx"

export function EditableTextField({
	className,
	label,
	description,
	...props
}: ComponentProps<typeof EditableText> & {
	label: ReactNode
	description?: ReactNode
}) {
	const id = useId()
	return (
		<Field
			className={className}
			label={label}
			description={description}
			htmlFor={id}
		>
			<EditableText id={id} {...props} />
		</Field>
	)
}
