import { AppLogoLink } from "./AppLogoLink.tsx"
import { UserButton } from "./UserButton.tsx"

export function AppHeader({ left }: { left?: React.ReactNode }) {
	return (
		<header className="flex h-16 items-center justify-between px-6">
			<div className="flex items-center gap-2">
				<AppLogoLink />
				{left}
			</div>
			<UserButton />
		</header>
	)
}
