import { clamp } from "es-toolkit"
import { ComponentProps, useState } from "react"
import { parseNumberSafe } from "../lib/utils.ts"

export type EditableNumberConfig = {
	min?: number
	max?: number
	value: number
	onChange: (value: number) => void
}

export function useEditableNumber({
	value: valueProp,
	min = 0,
	max = Number.POSITIVE_INFINITY,
	onChange,
}: EditableNumberConfig) {
	const value = clamp(valueProp, min, max)

	const [editingValue, setEditingValue] = useState<string>()
	const isEditing = editingValue != null

	function submitNewValue(newValue: number) {
		onChange(clamp(newValue, min, max))
	}

	function wheelHandlerRef(element: HTMLElement | null) {
		const controller = new AbortController()

		element?.addEventListener(
			"wheel",
			(event) => {
				// INTENTIONALLY only allow editing when focused,
				// otherwise accidental tweaks while scrolling the page are too easy
				if (!editingValue) return

				event.preventDefault()

				if (event.deltaY < 0) tweak(1)
				if (event.deltaY > 0) tweak(-1)

				function tweak(delta: number) {
					const currentValue = parseNumberSafe(editingValue) ?? value
					const newValue = clamp(currentValue + delta, min, max)
					setEditingValue(String(newValue))
					onChange(newValue)
				}
			},
			{ signal: controller.signal, passive: false },
		)

		return () => controller.abort()
	}

	function rootProps() {
		return {
			ref: wheelHandlerRef,
		}
	}

	function inputProps() {
		return {
			inputMode: "numeric",
			value: editingValue,
			autoFocus: true,
			onFocus: (event) => {
				event.currentTarget.select()
			},
			onChange: (event) => {
				setEditingValue(event.currentTarget.value)
			},
			onBlur: () => {
				submitNewValue(parseNumberSafe(editingValue) ?? 0)
				setEditingValue(undefined)
			},
			onKeyDown: (event) => {
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
			},
		} satisfies ComponentProps<"input">
	}

	function buttonProps() {
		return {
			onClick: () => setEditingValue(String(value)),
			onFocus: () => setEditingValue(String(value)),
		} satisfies ComponentProps<"button">
	}

	return {
		value,
		isEditing,
		rootProps,
		inputProps,
		buttonProps,
	}
}
