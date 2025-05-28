import * as Ariakit from "@ariakit/react"
import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export type SelectChoice = {
	value: string
	label?: ReactNode
	/** Displays beneath the select while this choice is selected */
	description?: ReactNode
}

export function SelectField({
	className,
	label,
	description,
	choices: choicesProp,
	placeholder,
	value,
	onChangeValue,
}: {
	className?: string
	label: ReactNode
	description?: ReactNode
	placeholder: ReactNode
	choices: Array<SelectChoice>
	value: string
	onChangeValue: (value: string) => void
}) {
	const choices = choicesProp.map((it) => ({
		...it,
		label: it.label ?? it.value,
	}))
	return (
		<Ariakit.SelectProvider
			value={value}
			setValue={onChangeValue}
			setValueOnMove
		>
			<div className={twMerge("flex flex-col gap-0.5", className)}>
				<Ariakit.SelectLabel className="text-sm font-semibold">
					{label}
				</Ariakit.SelectLabel>
				<p className="text-xs empty:hidden">{description}</p>
				<Ariakit.Select className="relative flex control items-center justify-between">
					<Ariakit.SelectValue>
						{(value) =>
							choices.find((opt) => opt.value === value)?.label ?? placeholder
						}
					</Ariakit.SelectValue>
					<div className="absolute right-1">
						<Ariakit.SelectArrow />
					</div>
				</Ariakit.Select>
			</div>

			<Ariakit.SelectPopover
				className="menu-panel"
				unmountOnHide
				fixed
				gutter={8}
				portal
				backdrop={
					<div className="fixed inset-0 bg-black/25 opacity-0 transition data-enter:opacity-100" />
				}
			>
				{choices.map((option) => (
					<Ariakit.SelectItem
						key={option.value}
						value={option.value}
						className="menu-item flex flex-col items-start gap-0"
					>
						<div>{option.label}</div>
						<div className="text-sm text-gray-300">{option.description}</div>
					</Ariakit.SelectItem>
				))}
			</Ariakit.SelectPopover>
		</Ariakit.SelectProvider>
	)
}
