import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export type BadgeColor = keyof typeof badgeColorClasses

const badgeColorClasses = {
	default: twMerge("bg-gray-700/40"),
	bright: twMerge("bg-gray-600/40"),
	red: twMerge("bg-red-700/40"),
	blue: twMerge("bg-blue-700/40"),
	green: twMerge("bg-green-700/40"),
	yellow: twMerge("bg-yellow-700/40"),
	purple: twMerge("bg-purple-700/40"),
}

export function Badge({
	color = "default",
	children,
}: {
	color?: BadgeColor
	children: ReactNode
}) {
	return (
		<span
			data-color={color}
			className={twMerge(
				`flex h-5 items-center rounded-md px-1.25 text-xs leading-none font-medium`,
				badgeColorClasses[color],
			)}
		>
			{children}
		</span>
	)
}
