import * as Ariakit from "@ariakit/react"
import { omit } from "es-toolkit"
import { type ReactElement } from "react"
import { twMerge } from "tailwind-merge"
import { Icon } from "./Icon.tsx"

const appearanceClasses = {
	default: twMerge(
		"panel-dark hover:bg-gray-900 hover:border-gray-700 focus:ring-primary-500/50",
	),
	ghost: twMerge(
		"border-transparent opacity-75 hover:bg-gray-500/30 hover:opacity-100 focus-visible:ring-gray-500/50 active:bg-gray-500/50 active:duration-0",
	),
} as const

const sizeClasses = {
	sm: {
		button: twMerge("px-2 h-7 text-sm gap-2"),
		icon: twMerge("*:size-3 -mx-0.5"),
	},
	default: {
		button: twMerge("px-3 h-10 text-base gap-2"),
		icon: twMerge("*:size-4 -mx-0.5"),
	},
	lg: {
		button: twMerge("px-5 h-11 text-lg gap-3.5"),
		icon: twMerge("*:size-5 -mx-1.5"),
	},
} as const

const shapeClasses = {
	default: twMerge("rounded"),
	circle: twMerge("rounded-full aspect-square"),
}

export interface ButtonProps extends Ariakit.ButtonProps {
	appearance?: keyof typeof appearanceClasses
	size?: keyof typeof sizeClasses
	shape?: keyof typeof shapeClasses
	icon?: string | ReactElement
	as?: "button" | "link"
	pending?: boolean
	align?: "start" | "center" | "end"
}

/**
 * Button component with customizable appearance, size, and icon support.
 *
 * ```tsx
 * // Basic button
 * const basic = <Button icon="mingcute:save-fill">Save</Button>
 *
 * // As a span (useful for file upload labels)
 * const span = (
 * 	<label>
 * 		<Button render={<span />} icon="mingcute:upload-fill">
 * 			Upload
 * 		</Button>
 * 		<input type="file" hidden />
 * 	</label>
 * )
 * ```
 */

export function Button({
	appearance = "default",
	size = "default",
	shape = "default",
	icon,
	className = "",
	children,
	pending,
	align = "start",
	...props
}: ButtonProps) {
	const combinedClasses = twMerge(
		"flex items-center transition border shadow-sm focus:outline-none ring-2 ring-transparent leading-none",
		appearanceClasses[appearance],
		sizeClasses[size].button,
		shapeClasses[shape],
		className,
		align === "start" && "text-start justify-start",
		align === "center" && "text-center justify-center",
		align === "end" && "text-end justify-end",
	)

	const content = (
		<>
			<div className={twMerge(`empty:hidden`, sizeClasses[size].icon)}>
				{pending ?
					<Icon icon="mingcute:loading-3-fill" className="animate-spin" />
				: typeof icon === "string" ?
					<Icon icon={icon} />
				:	icon}
			</div>
			{children}
		</>
	)

	return (
		<Ariakit.Button
			className={combinedClasses}
			type="button"
			{...omit(props, ["as"])}
		>
			{content}
		</Ariakit.Button>
	)
}
