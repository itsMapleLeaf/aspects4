import * as Ariakit from "@ariakit/react"
import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export function SelectField({
	className,
	label,
	description,
	options,
	placeholder,
	value,
	onChangeValue,
}: {
	className?: string
	label: ReactNode
	description?: ReactNode
	placeholder: ReactNode
	options: Array<{ value: string; label: string; description?: ReactNode }>
	value: string
	onChangeValue: (value: string) => void
}) {
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
							options.find((opt) => opt.value === value)?.label ?? placeholder
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
			>
				{options.map((option) => (
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
