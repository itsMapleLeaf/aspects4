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
		<Field className={className} label={label} htmlFor={id}>
			<p className="text-xs whitespace-pre-line text-gray-300 empty:hidden">
				{description}
			</p>
			<EditableText id={id} {...props} />
		</Field>
	)
}
