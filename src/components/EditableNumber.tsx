import { clamp } from "es-toolkit"
import { useState } from "react"
import { Button } from "~/components/ui/Button.tsx"
import { Input } from "~/components/ui/Input.tsx"
import { safeParseNumber } from "~/lib/utils.ts"

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
	const [editing, setEditing] = useState(false)

	const wheelHandlerRef = (element: HTMLElement | null) => {
		const controller = new AbortController()

		element?.addEventListener(
			"wheel",
			(event) => {
				const tweak = (delta: number) => {
					event.preventDefault()

					const currentValue =
						event.target instanceof HTMLInputElement ?
							(safeParseNumber(event.target.value) ?? 0)
						:	value

					const newValue = clamp(currentValue + delta, min, max)

					if (event.target instanceof HTMLInputElement) {
						event.target.value = String(newValue)
					}

					onChange(newValue)
				}

				if (event.deltaY < 0) tweak(1)
				if (event.deltaY > 0) tweak(-1)
			},
			{ signal: controller.signal, passive: false },
		)

		return () => controller.abort()
	}

	return editing ?
			<Input
				id={id}
				className={className}
				align="center"
				inputMode="numeric"
				autoFocus
				defaultValue={value}
				ref={wheelHandlerRef}
				onFocus={(event) => {
					event.currentTarget.select()
				}}
				onBlur={(event) => {
					onChange(clamp(Number(event.currentTarget.value) || 0, min, max))
					setEditing(false)
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault()
						onChange(clamp(Number(event.currentTarget.value) || 0, min, max))
						setEditing(false)
					}
					if (event.key === "ArrowUp") {
						event.preventDefault()
						const newValue = clamp(
							(Number(event.currentTarget.value) || 0) + 1,
							min,
							max,
						)
						event.currentTarget.value = String(newValue)
						onChange(newValue)
					}
					if (event.key === "ArrowDown") {
						event.preventDefault()
						const newValue = clamp(
							(Number(event.currentTarget.value) || 0) - 1,
							min,
							max,
						)
						event.currentTarget.value = String(newValue)
						onChange(newValue)
					}
				}}
			/>
		:	<Button
				onClick={() => setEditing(true)}
				onFocus={() => setEditing(true)}
				align="center"
				className={className}
			>
				{value}
			</Button>
}
