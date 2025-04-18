import { useState } from "react"
import { twMerge } from "tailwind-merge"
import { Icon } from "./ui/Icon.tsx"

export function EditableText({
	id,
	className,
	value,
	placeholder,
	onChange,
}: {
	id?: string
	className?: string
	value: string
	placeholder?: string
	onChange: (value: string) => void
}) {
	const [editing, setEditing] = useState(false)
	const [tempValue, setTempValue] = useState(value)

	const startEditing = () => {
		setEditing(true)
		setTempValue(value)
	}

	const handleSubmit = () => {
		const trimmedValue = tempValue.trim()
		if (trimmedValue && trimmedValue !== value) {
			onChange(trimmedValue)
			setEditing(false)
		} else if (!trimmedValue) {
			setTempValue("") // Clear whitespace
		} else {
			setEditing(false)
		}
	}

	return (
		<div className={twMerge("flex flex-col gap-1", className)}>
			{editing ?
				<input
					id={id}
					className={`h-9 w-full rounded border ${!tempValue.trim() ? "border-red-500" : "border-gray-800"} bg-gray-950/25 px-3 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none`}
					value={tempValue}
					placeholder={placeholder}
					autoFocus
					onFocus={(event) => {
						event.currentTarget.select()
					}}
					onChange={(e) => setTempValue(e.target.value)}
					onBlur={handleSubmit}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault()
							handleSubmit()
						}
						if (event.key === "Escape") {
							event.preventDefault()
							setTempValue(value) // Reset to original value
							setEditing(false)
						}
					}}
				/>
			:	<button
					id={id}
					type="button"
					className="flex h-9 w-full items-center justify-between rounded border border-gray-800 bg-gray-950/25 px-3 text-left hover:border-gray-700 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none"
					onClick={startEditing}
					onFocus={startEditing}
				>
					<span>{value || placeholder}</span>
					<Icon icon="mingcute:edit-line" className="size-4 text-gray-400" />
				</button>
			}
		</div>
	)
}
