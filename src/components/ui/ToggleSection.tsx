import {
	Disclosure,
	DisclosureContent,
	DisclosureProvider,
} from "@ariakit/react"
import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import type { Except } from "type-fest"
import { Icon } from "~/components/ui/Icon.tsx"
import { useLocalStorageState } from "~/hooks/storage"

export function ToggleSection({
	title,
	storageKey,
	className,
	children,
	titlePostfix,
	defaultOpen = false,
	...props
}: Except<ComponentProps<"details">, "title"> & {
	title: ReactNode
	storageKey?: string
	titlePostfix?: ReactNode
	defaultOpen?: boolean
}) {
	const [open, setOpen] = useLocalStorageState(
		`ToggleSection:${storageKey ?? title}`,
		defaultOpen,
		Boolean,
	)
	return (
		<section className={twMerge("", className)} {...props}>
			<DisclosureProvider open={open} setOpen={setOpen}>
				<header className="grid grid-cols-[1fr_auto]">
					<Disclosure className="group flex cursor-default list-none items-center gap-1 heading-2xl transition select-none hover:text-primary-200">
						<Icon
							icon="mingcute:right-fill"
							className="size-6 transition group-aria-expanded:rotate-90"
						/>
						{title}
					</Disclosure>
					<div className="">{titlePostfix}</div>
				</header>
				<DisclosureContent className="">{children}</DisclosureContent>
			</DisclosureProvider>
		</section>
	)
}
