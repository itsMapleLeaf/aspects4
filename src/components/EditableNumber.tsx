import { clamp } from "es-toolkit"
import { useId, useState, type ComponentProps, type ReactNode } from "react"
import { Button } from "~/components/ui/Button.tsx"
import { Field } from "~/components/ui/Field.tsx"
import { Input } from "~/components/ui/Input.tsx"
import { parseNumberSafe } from "~/lib/utils.ts"

export function EditableNumber({
	id,
	className,
	value: valueProp,
	min = 0,
	max = Number.POSITIVE_INFINITY,
	onChange,
}: {
	id?: string
	className?: string
	min?: number
	max?: number
	value: number
	onChange: (value: number) => void
}) {
	const value = clamp(valueProp, min, max)
	const [editingValue, setEditingValue] = useState<string>()

	function submitNewValue(newValue: number) {
		onChange(clamp(newValue, min, max))
	}

	function wheelHandlerRef(element: HTMLElement | null) {
		const controller = new AbortController()

		element?.addEventListener(
			"wheel",
			(event) => {
				event.preventDefault()

				if (event.deltaY < 0) tweak(1)
				if (event.deltaY > 0) tweak(-1)

				function tweak(delta: number) {
					const currentValue = parseNumberSafe(editingValue) ?? value
					submitNewValue(clamp(currentValue + delta, min, max))
					setEditingValue(undefined)
				}
			},
			{ signal: controller.signal, passive: false },
		)

		return () => controller.abort()
	}

	return (
		<div ref={wheelHandlerRef}>
			{editingValue != null ?
				<Input
					id={id}
					className={className}
					align="center"
					inputMode="numeric"
					value={editingValue}
					autoFocus
					onFocus={(event) => {
						event.currentTarget.select()
					}}
					onChange={(event) => {
						setEditingValue(event.currentTarget.value)
					}}
					onBlur={() => {
						submitNewValue(parseNumberSafe(editingValue) ?? 0)
						setEditingValue(undefined)
					}}
					onKeyDown={(event) => {
						const editingValueNormalized = parseNumberSafe(editingValue) ?? 0

						if (event.key === "Enter") {
							event.preventDefault()
							submitNewValue(editingValueNormalized)
							setEditingValue(undefined)
						}

						if (event.key === "ArrowUp") {
							event.preventDefault()
							const newValue = editingValueNormalized + 1
							submitNewValue(newValue)
							setEditingValue(String(clamp(newValue, min, max)))
						}

						if (event.key === "ArrowDown") {
							event.preventDefault()
							const newValue = editingValueNormalized - 1
							submitNewValue(newValue)
							setEditingValue(String(clamp(newValue, min, max)))
						}
					}}
				/>
			:	<Button
					id={id}
					onClick={() => setEditingValue(String(value))}
					onFocus={() => setEditingValue(String(value))}
					align="center"
					className={className}
				>
					{value}
				</Button>
			}
		</div>
	)
}

export function EditableNumberField({
	label,
	...props
}: ComponentProps<typeof EditableNumber> & { label: ReactNode }) {
	const id = useId()
	return (
		<Field label={label} htmlFor={props.id ?? id}>
			<EditableNumber id={id} {...props} />
		</Field>
	)
}
