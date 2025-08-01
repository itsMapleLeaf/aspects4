import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import { IconTooltip } from "./IconTooltip.tsx"

type InputProps = {
	label?: string
	error?: string
	hint?: string
	suffix?: ReactNode
	align?: "start" | "center" | "end"
} & ComponentProps<"input">

export function Input({
	label,
	error,
	hint,
	suffix,
	className = "",
	readOnly = false,
	align = "start",
	...props
}: InputProps) {
	return (
		<div className={twMerge("flex min-w-0 flex-col", className)}>
			{label && (
				<label className="mb-0.5 flex items-center gap-1 text-sm text-gray-300">
					<p className="font-semibold">{label}</p>
					{hint && <IconTooltip content={hint} className="size-4" />}
				</label>
			)}
			<div className="flex flex-1 items-center gap-2">
				<input
					className={twMerge(
						`input flex-1`,
						align === "start" && "text-start",
						align === "center" && "text-center",
						align === "end" && "text-end",
						error &&
							!readOnly &&
							"border-red-300 focus:border-red-500 focus:ring-red-500",
					)}
					readOnly={readOnly}
					{...props}
				/>
				{suffix}
			</div>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	)
}
