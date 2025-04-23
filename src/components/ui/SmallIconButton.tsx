import * as Ariakit from "@ariakit/react"
import { twMerge } from "tailwind-merge"
import { Icon } from "./Icon.tsx"

export interface SmallIconButtonProps extends Ariakit.ButtonProps {
	icon: string
	label: string
}

export function SmallIconButton({
	icon,
	label,
	...props
}: SmallIconButtonProps) {
	return (
		<Ariakit.Button
			type="button"
			{...props}
			className={twMerge(
				"flex size-8 items-center justify-center gap-2 rounded transition-colors hover:bg-white/5",
				props.className,
			)}
		>
			<Icon icon={icon} />
			<span className="sr-only">{label}</span>
		</Ariakit.Button>
	)
}
