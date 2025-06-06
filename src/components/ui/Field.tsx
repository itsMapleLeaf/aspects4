import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export function Field({
	label,
	description,
	className,
	children,
	htmlFor,
	...props
}: ComponentProps<"div"> & {
	label: ReactNode
	description?: ReactNode
	htmlFor?: string
}) {
	const LabelComponent = htmlFor ? "label" : "div"
	return (
		<div className={twMerge("flex flex-col gap-0.5", className)} {...props}>
			<LabelComponent
				htmlFor={htmlFor}
				className="cursor-default text-sm/5 font-semibold"
			>
				{label}
			</LabelComponent>
			<p className="text-xs whitespace-pre-line empty:hidden">{description}</p>
			{children}
		</div>
	)
}
