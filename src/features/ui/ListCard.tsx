import * as Ariakit from "@ariakit/react"
import {
	cloneElement,
	HTMLAttributes,
	ReactElement,
	ReactNode,
	useId,
} from "react"
import { twMerge } from "tailwind-merge"
import { type Iconable, renderIconable } from "./Iconable.tsx"

export interface ListCardProps extends HTMLAttributes<HTMLElement> {
	heading: ReactNode
	tags: Array<{
		icon: Iconable
		iconLabel: string
		text: ReactNode
	}>
	element?: ReactElement<HTMLAttributes<HTMLElement>>
}

export function ListCard({
	heading,
	tags,
	children,
	element = <section />,
	...props
}: ListCardProps) {
	const headingId = useId()
	return cloneElement(element, {
		"aria-labelledby": headingId,
		"className": twMerge(
			"flex flex-col items-start gap-2 panel px-3 py-2.5 transition hover:border-gray-700 hover:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none",
			props.className,
		),
		"children": (
			<Ariakit.HeadingLevel>
				<Ariakit.Heading
					id={headingId}
					className="text-xl/tight font-medium text-white"
				>
					{heading}
				</Ariakit.Heading>
				{children}
				<aside className="flex items-center gap-2 text-sm text-gray-400">
					{tags.map((tag, index) => (
						<p
							// eslint-disable-next-line react-x/no-array-index-key
							key={index}
							className="flex items-center gap-1 text-sm text-gray-400"
						>
							<span className="sr-only">{tag.iconLabel}</span>
							{renderIconable(tag.icon)}
							<span>{tag.text}</span>
						</p>
					))}
				</aside>
			</Ariakit.HeadingLevel>
		),
	})
}
