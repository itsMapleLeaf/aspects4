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

	const wheelHandlerRef = (element: HTMLElement | null) => {
		const controller = new AbortController()

		element?.addEventListener(
			"wheel",
			(event) => {
				if (event.deltaY < 0) tweak(1)
				if (event.deltaY > 0) tweak(-1)

				function tweak(delta: number) {
					event.preventDefault()

					const currentValue = parseNumberSafe(editingValue) ?? value
					const newValue = clamp(currentValue + delta, min, max)

					onChange(newValue)
					setEditingValue(String(newValue))
				}
			},
			{ signal: controller.signal, passive: false },
		)

		return () => controller.abort()
	}

	return (
		<div ref={wheelHandlerRef} className="contents">
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
						onChange(clamp(parseNumberSafe(editingValue) ?? 0, min, max))
						setEditingValue(undefined)
					}}
					onKeyDown={(event) => {
						const normalizedEditingValue = clamp(
							parseNumberSafe(editingValue) ?? 0,
							min,
							max,
						)

						if (event.key === "Enter") {
							event.preventDefault()
							onChange(normalizedEditingValue)
							setEditingValue(undefined)
						}

						if (event.key === "ArrowUp") {
							event.preventDefault()
							const newValue = normalizedEditingValue + 1
							setEditingValue(String(newValue))
							onChange(newValue)
						}

						if (event.key === "ArrowDown") {
							event.preventDefault()
							const newValue = normalizedEditingValue - 1
							setEditingValue(String(newValue))
							onChange(newValue)
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
