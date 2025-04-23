import { useState } from "react"
import { twMerge } from "tailwind-merge"
import { Button } from "./ui/Button.tsx"
import { Icon } from "./ui/Icon.tsx"
import { Input } from "./ui/Input.tsx"
import { TextArea } from "./ui/TextArea.tsx"

export function EditableText({
	id,
	className,
	value,
	placeholder,
	multiline = false,
	onChange,
}: {
	id?: string
	className?: string
	value: string
	placeholder?: string
	multiline?: boolean
	onChange: (value: string) => void
}) {
	const [editing, setEditing] = useState(false)
	const InputComponent = multiline ? TextArea : Input

	function commit(newValue: string) {
		onChange(newValue)
		setEditing(false)
	}

	return (
		<div className={twMerge("flex flex-col gap-1", className)}>
			{editing === false ?
				<Button
					id={id}
					className="h-fit min-h-control-height py-1.5 whitespace-pre-line"
					align="start"
					onClick={() => setEditing(true)}
					onFocus={() => setEditing(true)}
				>
					{value || placeholder}
					<Icon
						icon="mingcute:edit-line"
						className="size-4 shrink-0 text-gray-400"
					/>
				</Button>
			:	<InputComponent
					id={id}
					defaultValue={value}
					placeholder={placeholder}
					autoFocus
					onFocus={(event) => {
						event.currentTarget.select()
					}}
					onBlur={(event) => {
						commit(event.currentTarget.value)
					}}
					onKeyDown={(event) => {
						if (!multiline && event.key === "Enter") {
							event.preventDefault()
							commit(event.currentTarget.value)
						}
						if (multiline && event.key === "Enter" && event.ctrlKey) {
							event.preventDefault()
							commit(event.currentTarget.value)
						}
						if (event.key === "Escape") {
							event.preventDefault()
							commit(event.currentTarget.value)
						}
					}}
				/>
			}
		</div>
	)
}
