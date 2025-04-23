import { ComponentProps, ReactNode, useId } from "react"
import { twMerge } from "tailwind-merge"
import { Field } from "~/components/ui/Field.tsx"

export function SelectField({
	className,
	label,
	options,
	...props
}: ComponentProps<typeof Select> & {
	label: ReactNode
}) {
	const id = useId()
	return (
		<Field className={className} label={label} htmlFor={id}>
			<Select id={id} options={options} {...props} />
			<div className="mt-1 text-sm font-medium empty:hidden">
				{options.find((opt) => opt.value === props.value)?.description}
			</div>
		</Field>
	)
}

export function Select({
	className,
	options,
	placeholder,
	value,
	onChange,
	...props
}: ComponentProps<"select"> & {
	placeholder: string
	options: Array<{ value: string; label: string; description?: ReactNode }>
}) {
	return (
		<select
			className={twMerge("control", className)}
			value={value || ""}
			onChange={onChange}
			{...props}
		>
			<option value="">{placeholder}</option>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	)
}
