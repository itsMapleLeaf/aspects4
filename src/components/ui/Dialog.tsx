import * as Ariakit from "@ariakit/react"
import type { ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import type { Except } from "type-fest"
import { Icon } from "~/components/ui/Icon"

export function Dialog(props: Ariakit.DialogProviderProps) {
	return <Ariakit.DialogProvider {...props} />
}

export function DialogButton(props: Ariakit.DialogDisclosureProps) {
	return <Ariakit.DialogDisclosure {...props} />
}

export interface DialogPanelProps extends Except<Ariakit.DialogProps, "title"> {
	title: ReactNode
}

export function DialogPanel({
	children,
	title,
	className,
	...props
}: DialogPanelProps) {
	return (
		<Ariakit.Dialog
			portal
			unmountOnHide
			backdrop={
				<div className="fixed inset-0 bg-black/50 opacity-0 backdrop-blur-sm transition data-enter:opacity-100" />
			}
			className={twMerge(
				"fixed top-1/2 left-1/2 flex h-fit max-h-[calc(100dvh-2rem)] w-[calc(100dvw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 scale-95 flex-col gap-4 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-4 opacity-0 shadow-lg transition data-enter:scale-100 data-enter:opacity-100",
				className,
			)}
			preventBodyScroll={false} // this just doesn't work correctly lol
			{...props}
		>
			<header className="flex items-center justify-between">
				<Ariakit.DialogHeading className="heading-2xl">
					{title}
				</Ariakit.DialogHeading>
				<Ariakit.DialogDismiss className="rounded p-1 transition hover:text-primary-300">
					<Icon icon="mingcute:close-fill" className="size-6" />
				</Ariakit.DialogDismiss>
			</header>
			{children}
		</Ariakit.Dialog>
	)
}
