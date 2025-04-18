import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export function Field({
	label,
	className,
	children,
	htmlFor,
	...props
}: ComponentProps<"div"> & { label: ReactNode; htmlFor?: string }) {
	return (
		<div className={twMerge("flex flex-col gap-0.5", className)} {...props}>
			<label htmlFor={htmlFor} className="text-sm/5 font-semibold">
				{label}
			</label>
			{children}
		</div>
	)
}
