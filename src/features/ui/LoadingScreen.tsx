import * as Ariakit from "@ariakit/react"
import { useId } from "react"
import { twMerge } from "tailwind-merge"
import { LoadingSpinner } from "./LoadingSpinner"

export interface LoadingScreenProps {
	message?: string
	className?: string
	children?: React.ReactNode
}

export function LoadingScreen({
	message = "Loading...",
	className,
	children,
}: LoadingScreenProps) {
	const headingId = useId()
	return (
		<Ariakit.HeadingLevel>
			<section
				aria-labelledby={headingId}
				className={twMerge(
					"flex flex-col items-center justify-center gap-4 text-white",
					className,
				)}
			>
				<LoadingSpinner className="text-white" />
				<Ariakit.Heading id={headingId} className="text-xl font-light">
					{message}
				</Ariakit.Heading>
				{children}
			</section>
		</Ariakit.HeadingLevel>
	)
}
