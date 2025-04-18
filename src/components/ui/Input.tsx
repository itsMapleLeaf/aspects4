import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import { IconTooltip } from "~/components/ui/IconTooltip.tsx"

type InputProps = {
	label?: string
	error?: string
	hint?: string
	suffix?: ReactNode
} & ComponentPropsWithoutRef<"input">

export function Input({
	label,
	error,
	hint,
	suffix,
	className = "",
	readOnly = false,
	...props
}: InputProps) {
	const baseInputClasses = twMerge(
		"panel-dark flex-1 px-3 h-10 min-w-0 border hover:bg-gray-950 rounded focus:outline-none transition ring-2 ring-transparent focus:ring-primary-500",
	)

	const stateClasses = twMerge(
		readOnly ? ""
		: error ? "border-red-300 focus:border-red-500 focus:ring-red-500"
		: "",
	)

	return (
		<div className={`min-w-0 ${className}`}>
			{label && (
				<label className="mb-0.5 flex items-center gap-1 text-sm text-gray-300">
					<p className="font-semibold">{label}</p>
					{hint && <IconTooltip content={hint} className="size-4" />}
				</label>
			)}
			<div className="flex items-center gap-2">
				<input
					className={`${baseInputClasses} ${stateClasses}`}
					readOnly={readOnly}
					{...props}
				/>
				{suffix}
			</div>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	)
}
