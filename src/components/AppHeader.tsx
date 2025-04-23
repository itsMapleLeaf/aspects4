import * as Ariakit from "@ariakit/react"
import { AppLogoLink } from "./AppLogoLink.tsx"
import { UserButton } from "./UserButton.tsx"

export function AppHeader({
	children,
	left,
}: {
	children: React.ReactNode
	left?: React.ReactNode
}) {
	return (
		<Ariakit.HeadingLevel>
			<header className="flex h-16 items-center justify-between px-6">
				<div className="flex items-center gap-2">
					<AppLogoLink />
					{left}
				</div>
				<UserButton />
			</header>
			{children}
		</Ariakit.HeadingLevel>
	)
}
