import { Link } from "react-router"
import { twMerge } from "tailwind-merge"
import { Button } from "../ui/Button.tsx"
import { UserButton } from "../user/UserButton.tsx"
import { AppLogoLink } from "./AppLogoLink.tsx"

export function AppHeader({
	left,
	className,
}: {
	left?: React.ReactNode
	className?: string
}) {
	return (
		<header
			aria-label="Site header"
			className={twMerge(
				"pointer-events-children flex h-16 items-center gap-6 px-6",
				className,
			)}
		>
			<div className="pointer-events-children flex items-center gap-2">
				<AppLogoLink />
				{left}
			</div>
			<div className="pointer-events-children ml-auto flex items-center gap-1">
				<Button
					appearance="ghost"
					render={<Link to="/templates" />}
					icon="mingcute:document-fill"
				>
					Templates
				</Button>
			</div>
			<UserButton />
		</header>
	)
}
