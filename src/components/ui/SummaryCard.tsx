import * as Ariakit from "@ariakit/react"
import { ReactNode, useId, type ComponentProps } from "react"

interface SummaryCardProps extends ComponentProps<"section"> {
	heading: ReactNode
	children: React.ReactNode
}

export function SummaryCard({ heading, children, ...props }: SummaryCardProps) {
	const headingId = useId()
	return (
		<Ariakit.HeadingLevel>
			<section aria-labelledby={headingId} {...props}>
				<Ariakit.Heading id={headingId} className="mb-0.5 heading-xl">
					{heading}
				</Ariakit.Heading>
				{children}
			</section>
		</Ariakit.HeadingLevel>
	)
}
